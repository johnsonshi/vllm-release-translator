"""
Unit and integration tests for the vLLM & Kubernetes Release Translation,
A/B Evaluation, Hill-Climbing, and Review Queue System.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from harness.evaluator import evaluate_generated_brief
from harness.generators import generate_weekly_edition, run_generator
from harness.pipeline import REVIEW_QUEUE_FILE, run_full_pipeline
from harness.server import build_site_bundle, record_review_decision

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestReleaseTranslatorHarness(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.summary = run_full_pipeline()
        cls.bundle = build_site_bundle()

    def test_hill_climbing_monotonic_progression_kubernetes(self) -> None:
        k8s = self.summary["kubernetes_control_ab"]
        s0 = k8s["v0_naive_baseline"]["composite_score"]
        s1 = k8s["v1_five_part_template"]["composite_score"]
        s2 = k8s["v2_salience_and_risk_ranker"]["composite_score"]
        s3 = k8s["v3_clustered_synthesis"]["composite_score"]
        s4 = k8s["v4_adoption_engine"]["composite_score"]

        self.assertLess(s0, s1)
        self.assertLess(s1, s3)
        self.assertLess(s2, s3)
        self.assertLess(s3, s4)
        self.assertGreaterEqual(s4, 0.92, "v4 must exceed 92% composite score on 10-version K8s control benchmark")
        self.assertEqual(k8s["v4_adoption_engine"]["factual_citation_precision"], 1.0)
        self.assertEqual(k8s["v4_adoption_engine"]["upgrade_risk_recall"], 1.0)
        self.assertEqual(k8s["v4_adoption_engine"]["five_part_completeness"], 1.0)

    def test_hill_climbing_transfer_to_vllm(self) -> None:
        vllm = self.summary["vllm_target_ab"]
        s0 = vllm["v0_naive_baseline"]["composite_score"]
        s4 = vllm["v4_adoption_engine"]["composite_score"]

        self.assertGreater(s4 - s0, 0.45)
        self.assertGreaterEqual(s4, 0.95)
        self.assertEqual(vllm["v4_adoption_engine"]["factual_citation_precision"], 1.0)
        self.assertEqual(vllm["v4_adoption_engine"]["upgrade_risk_recall"], 1.0)
        self.assertEqual(vllm["v4_adoption_engine"]["five_part_completeness"], 1.0)

    def test_single_release_five_part_structure_and_citations(self) -> None:
        raw_v034 = json.loads((REPO_ROOT / "corpus" / "vllm" / "raw" / "v0.34.0.json").read_text())
        gt_v034 = json.loads((REPO_ROOT / "corpus" / "vllm" / "ground_truth" / "v0.34.0.json").read_text())
        gen = run_generator("v4_adoption_engine", raw_v034)
        ev = evaluate_generated_brief(gen, raw_v034, gt_v034)

        self.assertIn("## 1. What's the Big Deal?", gen["markdown"])
        self.assertIn("## 2. Who Benefits?", gen["markdown"])
        self.assertIn("## 3. What Does the Jargon Mean?", gen["markdown"])
        self.assertIn("## 4. Should I Upgrade?", gen["markdown"])
        self.assertIn("## 5. Where's the Proof?", gen["markdown"])
        self.assertEqual(ev["factual_citation_precision"], 1.0)
        self.assertGreaterEqual(ev["headline_salience_recall"], 0.90)

    def test_weekly_edition_generation(self) -> None:
        weekly_raw = json.loads((REPO_ROOT / "corpus" / "vllm" / "weekly" / "latest_week.json").read_text())
        weekly_gen = generate_weekly_edition(weekly_raw, project="vllm")
        self.assertTrue(weekly_gen.get("is_weekly"))
        self.assertGreaterEqual(len(weekly_gen["sections"]["lwkd_patch_pulse"]), 5)
        self.assertGreaterEqual(len(weekly_gen["sections"]["whats_the_big_deal"]), 3)

    def test_review_approval_state_machine(self) -> None:
        target_id = "vllm:v0.34.0"
        approved = record_review_decision(target_id, "approved", note="LGTM for release portal")
        self.assertEqual(approved["status"], "approved")
        self.assertEqual(approved["reviewer_note"], "LGTM for release portal")

        disapproved = record_review_decision(target_id, "disapproved", note="Add ROCm note")
        self.assertEqual(disapproved["status"], "disapproved")

        reset = record_review_decision(target_id, "pending_review", note="")
        self.assertEqual(reset["status"], "pending_review")

        state = json.loads(REVIEW_QUEUE_FILE.read_text())
        self.assertEqual(state["counts"]["total"], len(state["items"]))


if __name__ == "__main__":
    unittest.main()
