window.__PUBLICATION_DATA__ = {
  "vllm": {
    "brand": "vLLM Pulse",
    "tagline": "What changed in vLLM \u2014 and what it means for the models you serve, the GPUs you own, and your inference bill.",
    "weekly": {
      "id": "this-week-in-vllm",
      "date_iso": "2026-11-19",
      "date_range": "Thursday, 2026-11-19 (Weekly Digest)",
      "reading_time": "4 min read",
      "headline": "This Week in vLLM (2026-11-19): Hopper Humming MoE Kernels, Specialized Drafters for Kimi-K3.1, and Faster Multimodal Encoder Scheduling",
      "intro": "Keep up with vLLM development in 5 minutes a week. This week merged 100+ pull requests across the core scheduler, speculative decoding, and ROCm/Hopper hardware kernels\u2014without requiring a version bump.",
      "tldr_cards": [
        {
          "tag": "Performance",
          "title": "Faster Hopper MoE Kernels for Inkling 2 & Block-FP8 to MXFP4 Requantization",
          "summary": "New Humming expert GEMM kernels landed for Hopper GPUs alongside lower-memory online requantization from block-FP8 to MXFP4\u2014cutting peak VRAM spikes during model load.",
          "impact": "Lower startup memory overhead on H100/H200 and higher token throughput on quantized MoE models.",
          "prs": [
            "#68761",
            "#68171"
          ]
        },
        {
          "tag": "Speculative Decoding",
          "title": "Kimi-K3.1 & NemotronH Multi-Token Prediction (MTP) Upgrades",
          "summary": "Grouped-Query Attention (GQA) DSpark draft models now run on vLLM's specialized drafter path for Kimi-K3.1, and multimodal embeddings now pass cleanly into NemotronH MTP.",
          "impact": "Unlocks 1.4x\u20131.8x faster interactive token streaming on Kimi-K3.1 and multimodal Nemotron deployments.",
          "prs": [
            "#68701",
            "#68153",
            "#68213"
          ]
        },
        {
          "tag": "Memory & Stability",
          "title": "Immediate Encoder Memory Reclamation & CPU Offload Leak Fixes",
          "summary": "The scheduler now frees consumed multimodal encoder inputs at schedule time rather than waiting for request completion, and releases CPU offload caches cleanly on shutdown.",
          "impact": "Prevents GPU/CPU memory bloat on vision-language (VLM) servers handling bursty image and video prompts.",
          "prs": [
            "#68799",
            "#68710",
            "#68729"
          ]
        }
      ],
      "sections": [
        {
          "category": "Featured Merges (Plain-English Breakdown)",
          "items": [
            {
              "title": "Free consumed multimodal encoder inputs at schedule time",
              "pr": "#68799",
              "pr_url": "https://github.com/vllm-project/vllm/pull/68799",
              "what_it_is": "Previously, temporary vision/audio encoder tensors stayed in memory longer than necessary during chunked prefill. The scheduler now frees those buffers as soon as the encoder pass finishes.",
              "why_you_care": "If you serve multimodal models (Qwen-VL, Pixtral, Gemma-3/4), you get more headroom for KV cache and fewer out-of-memory errors under heavy image concurrency."
            },
            {
              "title": "Serve GQA DSpark drafts on the specialized drafter for Kimi-K3.1",
              "pr": "#68701",
              "pr_url": "https://github.com/vllm-project/vllm/pull/68701",
              "what_it_is": "Connects Kimi-K3.1's Grouped-Query Attention (GQA) DSpark speculative draft model directly to vLLM's fast specialized drafter execution loop.",
              "why_you_care": "Cuts CPU launch overhead during speculative decoding, making single-user coding agents and reasoning loops noticeably snappier on Hopper and Blackwell."
            },
            {
              "title": "Don't pin the grammar bitmask during structured JSON output",
              "pr": "#68764",
              "pr_url": "https://github.com/vllm-project/vllm/pull/68764",
              "what_it_is": "Stops allocating page-locked (pinned) host memory for every structured-output grammar bitmask.",
              "why_you_care": "Eliminates host pinned-memory exhaustion when thousands of concurrent tool-calling or JSON-schema requests hit your server."
            }
          ]
        },
        {
          "category": "Other Notable Merges Across the Engine",
          "bullets": [
            "Inkling 2 gains Humming expert GEMM kernels on NVIDIA Hopper GPUs (#68761)",
            "ROCm fixes a cross-wave race condition in batched kpool decode updates on AMD Instinct GPUs (#68749)",
            "HiSparse attention now skips redundant GPU restores when a KV cache import is cancelled (#68729)",
            "Transformers modeling backend now fuses sliced packed-QKV projections automatically (#68698)",
            "SimpleCPUOffload cleanly releases host DRAM caches when the KV connector shuts down (#68710)",
            "Multimodal Hugging Face processors now accept raw NumPy image arrays directly without conversion overhead (#68655)"
          ]
        }
      ],
      "label": "2026-11-19 (Latest)"
    },
    "releases": [
      {
        "version": "v0.34.0",
        "badge": "Latest Release",
        "date": "2026-11-16",
        "stats": "1,061 commits from 412 contributors and 10 new models",
        "headline": "Extensible KV Cache by Default, Model Runner V2 Only, and Up to 1.95\u00d7 Faster Blackwell Decode",
        "executive_summary": "vLLM 0.34.0 is a landmark operational release. It turns on Extensible KV Cache by default (giving most deployments 25\u201355% more KV cache space without manual memory tuning), completes the transition to Model Runner V2 by removing the legacy V1 runner, and lands major kernel speedups for DeepSeek-V4.1, GLM-5.3, Kimi-K3, and Mistral Large 4 across NVIDIA Blackwell/Hopper and AMD MI355X.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Extensible KV Cache Is Now On by Default (Stop Tuning gpu_memory_utilization)",
              "status": "Default / GA",
              "status_tone": "green",
              "prs": [
                "#56492",
                "#67296",
                "#67485"
              ],
              "before": "Previously, you had to guess `--gpu-memory-utilization 0.90` at startup. Set it too low and you wasted expensive GPU HBM; set it too high and CUDA graph capture crashed with an Out-of-Memory (OOM) error.",
              "now": "vLLM now measures actual free GPU memory *after* model load and CUDA graph warmup, then dynamically expands the KV cache to fill available VRAM (`gpu_memory_utilization` now defaults to `1.0`). On an H200 running MiniMax-M3, KV capacity jumps from 433k to 672k tokens (+55%).",
              "config_snippet": "# Before v0.34.0:\nvllm serve mistralai/Mistral-Large-4 --gpu-memory-utilization 0.90\n\n# Now in v0.34.0 (recommended \u2014 let Extensible KV Cache size automatically):\nvllm serve mistralai/Mistral-Large-4\n\n# Optional fallback if sharing a GPU with another process:\nvllm serve mistralai/Mistral-Large-4 --gpu-memory-utilization 0.85 --no-enable-extensible-kv-cache"
            },
            {
              "title": "Model Runner V1 Is Gone \u2014 Model Runner V2 (MRV2) Powers Everything",
              "status": "Breaking Change",
              "status_tone": "amber",
              "prs": [
                "#63373",
                "#61464",
                "#60339"
              ],
              "before": "vLLM maintained two parallel GPU execution paths (V1 and V2), requiring fallback flags (`VLLM_USE_V2_MODEL_RUNNER=0`) for certain speculative decoding and dual-batch overlap features.",
              "now": "Model Runner V1 has been completely removed. MRV2 now natively supports dual-batch overlap, Decode Context Parallelism (DCP), suffix decoding on GPU without external plugins, and CUDA-graphed draft speculators.",
              "config_snippet": "# REMOVE this env var before upgrading (startup will fail if set):\nunset VLLM_USE_V2_MODEL_RUNNER"
            },
            {
              "title": "10 New Day-0 Models: Mistral Large 4 (1T), MiniMax-M3.1-Flash & NVIDIA Speech/ASR",
              "status": "New Capability",
              "status_tone": "cyan",
              "prs": [
                "#64534",
                "#64111",
                "#64282",
                "#64215"
              ],
              "before": "Serving 1-trillion-parameter sparse MoE models or running high-throughput speech transcription required separate inference stacks.",
              "now": "Day-0 support for Mistral Large 4 (1T total / 52B active in FP8 & NVFP4 on Blackwell/Hopper/MI350), MiniMax-M3.1-Flash, Liquid AI LFM3 (text/vision/audio), and NVIDIA Nemotron-3.5-Transcribe & Canary-1B-v2 via `/v1/audio/transcriptions`.",
              "config_snippet": "vllm serve mistralai/Mistral-Large-4 --quantization nvfp4 --tensor-parallel-size 8"
            },
            {
              "title": "Zero-Downtime Expert Scale-Down & Fast CRIU Checkpoint/Restore",
              "status": "Opt-in / Beta",
              "status_tone": "cyan",
              "prs": [
                "#46370",
                "#62570"
              ],
              "before": "When a single GPU node died in a multi-node Expert Parallel (DP+EP) cluster, the entire inference job crashed and had to cold-start from disk.",
              "now": "Fault-tolerant DP+EP scale-down removes dead ranks on the fly and redistributes MoE experts without a restart. Plus, new `/checkpoint/prepare` and `/checkpoint/restore` endpoints pair CRIU with `cuda-checkpoint` for sub-second container restore.",
              "config_snippet": "curl -X POST http://localhost:8000/checkpoint/prepare"
            }
          ],
          "who_benefits": [
            {
              "persona": "High-Concurrency Chat & Agent APIs",
              "models": "MiniMax-M3/M3.1, DeepSeek-V4.1, GLM-5.3, Qwen3.5",
              "gpus": "NVIDIA H100 / H200, Blackwell B200 / GB200",
              "impact": "+25% to +55% larger KV cache per GPU from Extensible KV Cache; 1.24\u00d7\u20131.40\u00d7 faster long-prompt TTFT."
            },
            {
              "persona": "Frontier MoE & 4-Bit Quantized Fleets",
              "models": "Mistral Large 4 (1T), Step5, GLM-5.3-Flash, Kimi-K3",
              "gpus": "NVIDIA GB200 / GB300 (NVFP4) & Hopper (FP8)",
              "impact": "Up to 1.95\u00d7 faster decode on GB200 and 1.6\u00d7 higher output throughput with DeepGEMM FP8 MegaMoE."
            },
            {
              "persona": "AMD Instinct GPU Operators",
              "models": "Muse Spark Open, Kimi-K3, Mistral Large 4",
              "gpus": "AMD MI355X & MI350 (ROCm 10.0)",
              "impact": "+35\u201357% higher token interactivity via FlyDSL decode monokernels and MoRI EPv2 all-to-all."
            },
            {
              "persona": "Multimodal & Voice Platform Teams",
              "models": "Nemotron-3.5-Transcribe, Canary-1B-v2, Pixtral/Mistral3, LFM3",
              "gpus": "All CUDA & ROCm GPUs",
              "impact": "1.6\u00d7\u20132.6\u00d7 faster packed vision encoding + native OpenAI `/v1/audio/transcriptions` support."
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Instead of guessing how much GPU memory to reserve upfront with a static percentage (`gpu_memory_utilization`), vLLM loads the model, captures CUDA graphs, checks how much VRAM is actually left over, and gives all of it to the token cache.",
              "bottom_line": "More concurrent users per GPU and fewer startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's rewritten GPU execution engine that keeps batch state resident on the GPU instead of rebuilding tensors on the CPU between every single token.",
              "bottom_line": "Lower per-token latency and simpler maintenance\u2014now the only GPU runner in vLLM."
            },
            {
              "term": "NVFP4 & DeepGEMM MegaMoE",
              "plain_english": "4-bit floating-point hardware math on NVIDIA Blackwell GPUs combined with fused Mixture-of-Experts (MoE) matrix kernels.",
              "bottom_line": "Lets you fit massive 400B\u20131T models on half as many GPUs while nearly doubling generation speed."
            },
            {
              "term": "Token-Sharded Sparse-MLA",
              "plain_english": "Splits Multi-head Latent Attention (MLA) prefill computation across GPUs by token chunks while attending only to the most relevant cached tokens.",
              "bottom_line": "Cuts Time-to-First-Token (TTFT) by 24\u201340% on 32K\u2013128K long-context prompts."
            }
          ],
          "upgrade_guide": {
            "verdict": "Upgrade Recommended \u2014 High throughput & KV capacity gains, but check 4 config changes first.",
            "rows": [
              {
                "change": "Model Runner V1 removed",
                "impact": "Setting `VLLM_USE_V2_MODEL_RUNNER=0` now causes an immediate startup error.",
                "action": "Remove `VLLM_USE_V2_MODEL_RUNNER=0` and port any custom V1 logits processors to V2.",
                "pr": "#63373"
              },
              {
                "change": "Extensible KV Cache enabled by default",
                "impact": "`gpu_memory_utilization` now defaults to `1.0`. Per-token latency (TPOT) can rise 6\u201318% at extreme concurrency (128+) on some H200 models.",
                "action": "Remove `--gpu-memory-utilization` from your launch scripts. To opt out, pass `--no-enable-extensible-kv-cache`.",
                "pr": "#56492"
              },
              {
                "change": "Default `--block-size` changed from 16 to 64",
                "impact": "CUDA paged attention now allocates 64-token blocks by default for better kernel efficiency.",
                "action": "Pass `--block-size 16` only if custom connectors or tests depend on 16-token blocks.",
                "pr": "#63231"
              },
              {
                "change": "ROCm 7.2 images dropped; ROCm 10.0 required",
                "impact": "`-rocm72` Docker tags and wheels are no longer published.",
                "action": "Switch to `vllm/vllm-openai-rocm:v0.34.0` (built on ROCm 10.0).",
                "pr": "#61939"
              },
              {
                "change": "Marlin W4A8 & QuTLASS `fp_quant` removed",
                "impact": "Legacy `VLLM_MARLIN_INPUT_DTYPE` and `fp_quant` checkpoints no longer load.",
                "action": "Migrate W4A8 workloads to `--quantization humming`.",
                "pr": "#65542"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Step5 NVFP4 MoE Decode Speedup",
              "hardware": "4\u00d7 NVIDIA GB200",
              "metric": "1.95\u00d7 faster decode",
              "pct_bar": 95,
              "pr": "#65152"
            },
            {
              "label": "GLM-5.3-Flash DeepGEMM FP8 MegaMoE",
              "hardware": "NVIDIA Hopper / Blackwell",
              "metric": "1.60\u00d7 output throughput",
              "pct_bar": 80,
              "pr": "#60895"
            },
            {
              "label": "MiniMax-M3 KV Cache Capacity Expansion",
              "hardware": "NVIDIA H200 (Extensible KV Cache)",
              "metric": "433k \u2192 672k tokens (+55%)",
              "pct_bar": 78,
              "pr": "#56492"
            },
            {
              "label": "Muse Spark Open DSpark Interactivity",
              "hardware": "8\u00d7 AMD Instinct MI355X",
              "metric": "+35% to +57% tok/s/user",
              "pct_bar": 72,
              "pr": "#63440"
            },
            {
              "label": "GLM-5.3 Long-Prompt (32K\u2013128K) TTFT",
              "hardware": "NVIDIA GB200 (Token-Sharded Sparse-MLA)",
              "metric": "1.24\u00d7\u20131.40\u00d7 faster TTFT",
              "pct_bar": 68,
              "pr": "#63956"
            }
          ]
        }
      },
      {
        "version": "v0.33.0",
        "badge": "Minor Release",
        "date": "2026-11-02",
        "stats": "840+ commits including DeepSeek-V4.1-Flash and K2-Horizon",
        "headline": "DeepSeek-V4.1-Flash MXFP8 KV Cache, Engine Snapshots via CRIU, and LibTorch Stable ABI",
        "executive_summary": "vLLM 0.33.0 introduces day-0 support for DeepSeek-V4.1-Flash with full MXFP8 KV cache compression on Blackwell SM100, experimental initialized-engine snapshots (`vllm snapshot create/restore`) for rapid cold starts, and completes the CUDA migration to the LibTorch Stable ABI.",
        "five_parts": {
          "big_deal": [
            {
              "title": "DeepSeek-V4.1-Flash with Full MXFP8 KV Cache on Blackwell (SM100)",
              "status": "New Capability",
              "status_tone": "green",
              "prs": [
                "#56214",
                "#56893",
                "#56962"
              ],
              "before": "Serving DeepSeek-V4 at 128K context required storing KV latents in 8-bit/16-bit formats without native microscaling block compression.",
              "now": "Full MXFP8 KV storage via FlashMLA V4.1 on SM100 GPUs, paired with DeepGEMM Mega-mHC kernels and async Engram DP sharding.",
              "config_snippet": "vllm serve deepseek-ai/DeepSeek-V4.1-Flash --kv-cache-dtype mxfp8 --tensor-parallel-size 8"
            },
            {
              "title": "Initialized Engine Snapshots (`vllm snapshot create / restore`)",
              "status": "Experimental / Alpha",
              "status_tone": "cyan",
              "prs": [
                "#51360"
              ],
              "before": "Every new replica had to re-run Python imports, weight loading, torch.compile, and CUDA graph capture\u2014taking 2 to 6 minutes on large models.",
              "now": "Snapshots a fully warmed-up TP1 engine using CRIU so new pods restore straight into a ready-to-serve state in seconds.",
              "config_snippet": "vllm snapshot create --model Qwen/Qwen3-32B --output /snapshots/qwen3-warm"
            },
            {
              "title": "LibTorch Stable ABI for CUDA Wheels",
              "status": "Default / GA",
              "status_tone": "green",
              "prs": [
                "#55810"
              ],
              "before": "Upgrading PyTorch by even a minor version broke vLLM's compiled C++/CUDA extensions, forcing a multi-hour source rebuild.",
              "now": "vLLM's CUDA kernels link against PyTorch's Stable ABI, allowing compatible PyTorch upgrades without recompiling vLLM.",
              "config_snippet": "pip install --upgrade torch vllm  # No C++ ABI mismatch rebuilds"
            }
          ],
          "who_benefits": [
            {
              "persona": "DeepSeek & Frontier MoE Operators",
              "models": "DeepSeek-V4.1-Flash, GLM-5.3-Flash, K2-Horizon, Cohere Compass",
              "gpus": "NVIDIA Blackwell SM100, Hopper H200, and AVX512/AMX CPUs",
              "impact": "2\u00d7 denser KV cache on SM100 via MXFP8 and dedicated CPU sparse-MLA backend for local testing."
            },
            {
              "persona": "Autoscaled Serverless GPU Platforms",
              "models": "All single-GPU (TP1) production models",
              "gpus": "Linux GPU nodes with CRIU enabled",
              "impact": "Cuts scale-from-zero cold start from minutes to seconds via `vllm snapshot restore`."
            }
          ],
          "jargon_decoded": [
            {
              "term": "MXFP8 (Microscaling FP8)",
              "plain_english": "An Open Compute standard 8-bit floating-point format with shared block exponents supported natively by Blackwell Tensor Cores.",
              "bottom_line": "Compresses KV cache memory with near-zero accuracy loss on 128K+ sequences."
            },
            {
              "term": "CRIU (Checkpoint/Restore In Userspace)",
              "plain_english": "A Linux tool that freezes a running process tree and its memory state to disk and restores it later without re-running initialization.",
              "bottom_line": "Skips slow CUDA graph capture when spinning up new inference replicas."
            }
          ],
          "upgrade_guide": {
            "verdict": "Safe Upgrade \u2014 Verify custom C++ extensions against the new Stable ABI build.",
            "rows": [
              {
                "change": "Legacy V0 speculative decoding flags removed",
                "impact": "Deprecated `--speculative-draft-tensor-parallel-size` flags are no longer accepted.",
                "action": "Use the unified `--speculative-config` JSON argument.",
                "pr": "#55912"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "DeepSeek-V4.1-Flash FlashMLA V4.1 MXFP8",
              "hardware": "NVIDIA Blackwell GB200 (SM100)",
              "metric": "1.7\u00d7 higher long-context throughput",
              "pct_bar": 85,
              "pr": "#56893"
            },
            {
              "label": "Granite & Qwen3-ASR EAGLE3 Speculative Decode",
              "hardware": "NVIDIA Hopper H100",
              "metric": "1.5\u00d7 faster token streaming",
              "pct_bar": 75,
              "pr": "#60855"
            }
          ]
        }
      },
      {
        "version": "v0.32.0",
        "badge": "Minor Release",
        "date": "2026-10-18",
        "stats": "760+ commits including Hy4-Preview (770B MoE) and Qwen3.8-Flash-Next",
        "headline": "Tencent Hy4-Preview 770B MoE, Qwen3.8-Flash-Next NVFP4, and Kimi-K3 on ROCm V2 Runner",
        "executive_summary": "vLLM 0.32.0 adds support for Tencent's 770B/49B-active Hy4-preview MoE model with Gated DeepSeek Sparse Attention, brings Qwen3.8-Flash-Next with BF16/FP8/NVFP4 and Multi-Token Prediction (MTP), and enables Kimi-K3 on AMD ROCm under Model Runner V2.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Hy4-Preview (770B Total / 49B Active MoE) & Qwen3.8-Flash-Next Support",
              "status": "New Capability",
              "status_tone": "green",
              "prs": [
                "#54160",
                "#53896",
                "#53132"
              ],
              "before": "Gated DeepSeek Sparse Attention and Qwen3.8 hybrid NVFP4 checkpoints lacked native fused execution paths.",
              "now": "Full day-0 serving for Hy4-preview, Qwen3.8-Flash-Next (BF16/FP8/NVFP4 + MTP), NemotronH Omni Reasoning V3, and Kimi-K3 NVFP4 checkpoints.",
              "config_snippet": "vllm serve Qwen/Qwen3.8-Flash-Next-NVFP4 --speculative-config '{\"method\": \"mtp\", \"num_speculative_tokens\": 2}'"
            },
            {
              "title": "Kimi-K3 Now Runs on AMD ROCm with Model Runner V2",
              "status": "Default / GA",
              "status_tone": "cyan",
              "prs": [
                "#51653"
              ],
              "before": "Kimi-K3 on AMD MI300X/MI350 was restricted to legacy runner paths without full V2 persistent batching.",
              "now": "Full parity on ROCm with Model Runner V2, unlocking higher concurrency and lower decode latency on AMD fleets.",
              "config_snippet": "vllm serve moonshotai/Kimi-K3-Instruct --tensor-parallel-size 8"
            }
          ],
          "who_benefits": [
            {
              "persona": "Ultra-Large MoE Serving Teams",
              "models": "Hy4-preview (770B), Qwen3.8-Flash-Next, Kimi-K3",
              "gpus": "Multi-node NVIDIA H200/GB200 & AMD MI300X/MI350",
              "impact": "4-bit NVFP4 checkpoint loading cuts cluster node requirements in half for 500B+ models."
            }
          ],
          "jargon_decoded": [
            {
              "term": "MTP (Multi-Token Prediction)",
              "plain_english": "Extra lightweight prediction heads trained directly into models like Qwen3.8 and DeepSeek that predict the next 2\u20133 tokens simultaneously.",
              "bottom_line": "Gives you speculative decoding speedups without having to host a separate draft model."
            }
          ],
          "upgrade_guide": {
            "verdict": "Recommended Upgrade \u2014 Essential if serving Qwen3.8, Hy4, or Kimi-K3 on ROCm.",
            "rows": [
              {
                "change": "Updated FlashInfer & CUTLASS DSL pins",
                "impact": "Custom wheel builds require updated CUTLASS headers.",
                "action": "Use the official prebuilt CUDA/ROCm wheels or container images.",
                "pr": "#53896"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Qwen3.8-Flash-Next NVFP4 + MTP",
              "hardware": "NVIDIA Blackwell B200",
              "metric": "1.8\u00d7 higher tok/s vs FP8 baseline",
              "pct_bar": 88,
              "pr": "#53896"
            }
          ]
        }
      },
      {
        "version": "v0.31.0",
        "badge": "Release",
        "date": "2026-10-05",
        "stats": "56 upstream changes and 510 PRs",
        "headline": "DeepSeek-V4.1-Flash performance, Fast restart",
        "executive_summary": "vLLM v0.31.0 ships 56 upstream changes. Key highlights include: DeepSeek-V4.1-Flash performance: FlashMLA mega attention with the V4.1 NVFP4 compressed KV cache is now the SM100 default (#56935); DeepGEMM sparse MQA logits f; Fast restart: the new `vllm preload` CLI launches the weight-cache daemon that keeps post-quantized weights resident in GPU memory across engine restarts (#5668; Model Runner V2 and speculative decoding: draft-model speculative decoding (#43091) and custom logits processors (#56497) on Model Runner V2; the new LiLiCorr d.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#58527",
                "#58651",
                "#57430"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Kimi K3 and MiniMax-M3: Kimi-K3 vision patch embedder as a GEMM (#58527), fused KimiViT QK RoPE (up to 29x, #58651), routed expert quantization (#57430), reasoning parser...; GLM-5.3-Flash: opt-in FlashAttention and FlashMLA sparse backends on SM90 (#55385), NoPE sparse MLA on the FlashInfer SM120 backend (#55277), cooperative top-k for small...; AMD ROCm: AITER v0.1.23 (#56885, #58867), torch 2.13 and Triton 3.8 (#50605, #58006), `triton_kernels` 3.8 MXFP4 MoE for gpt-oss and DeepSeek-V4 (#55934), a ROCR host...; Startup and memory: parallel Triton warmup compilation (#58582), JIT warmup disabled under `--enforce-eager` (#58197) unless fault tolerance is on (#58593), DeepGEMM warmup...; DeepSeek-V4.1-Flash: FlashMLA mega attention with the NVFP4 compressed KV cache as the SM100 default (#56935), DeepGEMM sparse MQA logits in the indexer (#56254), Mega-Gate...",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#56013",
                "#51600",
                "#44987"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Intel XPU: PyTorch 2.14 (#56013), XPU graphs on by default (#51600), EPLB (#44987), int8 W8A8 MoE on Triton (#53162), batch invariance (#55881), SYCL rotary embedding...; New defaults: `--enforce-eager` also disables JIT kernel warmup unless fault tolerance is enabled (#58197, #58593); `VLLM_BATCH_INVARIANT=1` uses breakable CUDA graphs without...; Model Runner V1 + PP > 1 + async scheduling + structured output is now rejected at startup (#56250); `json_object` is rejected at validation with the outlines backend (#57743).; Batch invariance: breakable CUDA graphs without torch.compile by default under `VLLM_BATCH_INVARIANT` (#57586), sequence parallelism and async TP disabled (#56377), and...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53585",
                "#51800",
                "#56685"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Online quantization through `quantization=\"fp8\"` now redirects to the `fp8_per_tensor` online shorthand (#53585); Quark-specific silent online MXFP4 quantization was removed in...; Humming: Hadamard transforms and NVFP4/MXFP4/MXFP8 online quantization (#56685), asymmetric wNaM through compressed-tensors (#46528), humming-kernels 0.1.16 (#58054), and...; New capabilities: native Quark W4A16 INT4/UINT4 exports (#48606), opt-in load-time MXFP4 dequantization (#50814), explicit per-token NVFP4 MoE backends (#57176), and a...; Fixes: MXFP8 on layers below `mm_mxfp8` shape limits (#54223), online NVFP4 scales on reload (#57954), LM head linear metadata (#58444), and the fused SiLU-mul block-quant...",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#56758",
                "#57951",
                "#58459"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "Scheduler: `--max-num-active-seqs` (#56758), adaptive `--long-prefill-token-threshold` (#57951, #58459), `skipped_waiting` replaced by a KV-holding waiting queue (#58947),...; Speculative decoding: LiLiCorr drafter (#57934), DFlash async scheduling (#58065) and context K/V in the draft CUDA graph (#57632), Gemma4 DSpark adaptive verification...; MoE communication: MoonEP backend (#52101), DeepEPv2 with sequence parallelism (#57210) and EPLB + shared-expert overlap (#57236), low-SM multimem reduce-scatter (#55072),...; New model capabilities: DiffusionGemma structured generation mode with bounded single-token choices (#57250), MiMo V2 MXFP4 MoE, BF16 MoE router and DFlash drafts (#57784),...; Model Runner V2: draft-model speculative decoding (#43091), custom logits processors (#56497) validated at admission (#57728), randomized dummy inputs (#58411), dummy...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Per-request `mm_processor_kwargs` and `media_io_kwargs` now return an error unless the server is started with `--trust-request-mm-kwargs`; server-level `--mm-processor-kwargs` / `--media-io-kwargs` and offline `LLM` are ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#58830"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`tokenizer_mode=\"slow\"` was removed; it already behaved like `\"hf\"` under Transformers v5 (#58545). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#58545"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`--enable-mamba-fine-grained-prefix-cache` was renamed to `--enable-mamba-shared-prefix-checkpoint` (#57382). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#57382"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Online quantization through `quantization=\"fp8\"` now redirects to the `fp8_per_tensor` online shorthand (#53585); Quark-specific silent online MXFP4 quantization was removed in favor of the online quantization API (#5180",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53585"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The AllSpark INT8 W8A16 GEMM backend was removed (#58001). The `return_assistant_tokens_mask` option of `/render` and the `assistant_tokens_mask` response field were removed (#57520). -> Action: Verify compatibility befo",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#58001"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "GLM-5.3-Flash: opt-in FlashAttention and FlashMLA sparse backends on SM90 (#55385), NoPE sparse MLA on the FlashInfer SM120 backend (#55277), cooperative top-k ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#55385"
            },
            {
              "label": "Model Support",
              "hardware": "Kimi K3 and MiniMax-M3: Kimi-K3 vision patch embedder as a GEMM (#58527), fused KimiViT QK RoPE (up to 29x, #58651), routed expert quantization (#57430), reason",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#58527"
            },
            {
              "label": "Model Support",
              "hardware": "DiffusionGemma: one-pass sampler statistics kernel (#58226), `diffusion_constrained` reads over `logprob_token_ids` (about 25% faster, #58216), fewer logit rows",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#58226"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: AITER v0.1.23 (#56885, #58867), torch 2.13 and Triton 3.8 (#50605, #58006), `triton_kernels` 3.8 MXFP4 MoE for gpt-oss and DeepSeek-V4 (#55934), a ROC",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#56885"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Intel XPU: PyTorch 2.14 (#56013), XPU graphs on by default (#51600), EPLB (#44987), int8 W8A8 MoE on Triton (#53162), batch invariance (#55881), SYCL rotary emb",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#56013"
            }
          ]
        }
      },
      {
        "version": "v0.30.0",
        "badge": "Release",
        "date": "2026-09-22",
        "stats": "58 upstream changes and 561 PRs",
        "headline": "New models, Fast Start",
        "executive_summary": "vLLM v0.30.0 ships 58 upstream changes. Key highlights include: New models: DeepSeek-V4.1-Flash (#56214, #56228, #56208) with the whole KV stored in MXFP8 through the FlashMLA V4.1 record on SM100 (#56893), DeepGEMM Mega-mHC; Fast Start: a persistent per-GPU weight-cache daemon holds post-quantized, TP-sharded weights in GPU memory so restarting engines map them over CUDA IPC with `-; Watermarking: Gumbel-max watermarked generation and detection with a keyed PRF, per-request opt-out and an example detection endpoint (#54053); dual-key Gumbel-.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53014",
                "#55170",
                "#55899"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "New defaults: FlashInfer CuTeDSL NVFP4 W4A16 over Marlin on SM100/103 (#53014), W4A4 NVFP4 over weight-only kernels on SM120/121 (#55170), BF16x3 router GEMM on SM100 (#55899),...; NVIDIA: FlashInfer PCIe IPC all-reduce (#53576), DeepGEMM pinned to the vLLM fork 2.8.0 with SM120 and SM90 paged-MQA ports (#56876), public CUDA 13.4 Rubin build path...; New capabilities: targeted online quantization (#51285) and online quantization of partially pre-quantized checkpoints (#51392), W4A16 DSA (#51724, #55538), FlashInfer...; Fixes: NVFP4 padding initialized in-kernel (#53568), unloaded NVFP4 scales detected with a NaN sentinel (#52501), NVFP4 fused SiLU+mul scales (#55643), Quark per-block...; GPTQ group/dynamic activation ordering removed: `g_idx` is ignored and the related Marlin, GPTQ, CPU and RDNA3 kernels are gone (#54809).",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#55119",
                "#55737",
                "#55738"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "GLM-5.3-Flash: EPLB support (#55119), FlashKDA for KDA chunked prefill (1.7-3.8x faster than the Triton chunk path, #55737), dense and masked-MHA sparse prefill for the...; AMD ROCm: TheRock base bumped to ROCm 10.0 (#55246) with nightly TheRock images (#55014), AITER 0.1.21.post2 (#52826, #55968), AITER custom AG/RS on the DP group (about 3%...; Kimi K3: native CUDA AttnRes default on SM100 (#54261), ll_bf16 router weight prefetch (#53524), overlapped TP8 KDA projections (#54697), strided DSV3 GEMM (#54565), MLA...; CPU: DeepSeek-V4 backend (#55355), native AMX-FP8 attention for Diamond Rapids with the Docker base moved to Ubuntu 25.04 and GCC 15 (#49410), faster LM head on Arm (about...; DeepSeek-V4.1-Flash: whole KV in MXFP8 through the FlashMLA V4.1 record on SM100 (#56893), Mega-mHC from the DeepGEMM fork (#56962), mHC post block folded into the delayed...",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#55780",
                "#55353",
                "#54921"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "Attention implementations must explicitly declare DCP support; DCP with ROCm standard attention, Triton, FlexAttention or TurboQuant now fails at backend selection (#55780).; Items deprecated for 0.29 removed: `VLLM_PREFIX_CACHE_RETENTION_INTERVAL` and `VLLM_MM_HASHER_ALGORITHM` env vars (use the config fields), the `use_fp4_indexer_cache` alias...; Fast Start: weight-cache daemon with `--load-format ipc_cache` (#54921), FP4 checkpoints (#55465), multi-node TP (#55468), GPU UUID socket folders (#56669), per-client IPC...; ROCm: TheRock base on ROCm 10.0 (#55246), AITER 0.1.21.post2 (#52826, #55968), Mooncake from public wheels (#55002), AINIC libionic 54.0-187-1 pinned to a snapshot (#54112,...; Structured output and parsers: XGrammar `patternProperties`/`propertyNames`/`unevaluatedProperties` (#42904), full-history reasoning scans eliminated (#55223) with...",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#55780",
                "#54782",
                "#55095"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Robustness: attention implementations must explicitly declare DCP support (#55780), unavailable piecewise CUDA graphs raise instead of producing garbled output (#54782),...; Qwen3.8-Flash-Next: separate prefill and decode QSA indexer kernels with `VLLM_SPARSE_INDEXER_MAX_LOGITS_MB` (#54513), fused PLE kernels and merged K/V projections...; The `all` Mamba cache mode is deprecated and falls back to Model Runner V1 (#55041).; Elastic EP and MoE communication: CUDA graphs reused across reconfiguration (#54985), routing only to surviving engines on scale-down (#55772), DeepEP v2 async finalize...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Scale-out endpoints (`/render`, `/derender`, `/inference/v1/generate`) are no longer registered on plain `vllm serve` unless `--enable-scale-out` is passed; `VLLM_ENABLE_SCALE_OUT_ENDPOINTS` was removed. `vllm launch ren",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#54579"
              },
              {
                "change": "Before You Upgrade",
                "impact": "GPTQ group/dynamic activation ordering removed: `g_idx` is ignored and the related Marlin, GPTQ, CPU and RDNA3 kernels are gone (#54809). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#54809"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Items deprecated for 0.29 removed: `VLLM_PREFIX_CACHE_RETENTION_INTERVAL` and `VLLM_MM_HASHER_ALGORITHM` env vars (use the config fields), the `use_fp4_indexer_cache` alias (use `indexer_kv_dtype`), the `CUDA_VISIBLE_DEV",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#55353"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The `all` Mamba cache mode is deprecated and falls back to Model Runner V1 (#55041). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#55041"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`python -m vllm.entrypoints.grpc_server` is deprecated; use `vllm serve --grpc` (#56746). `sse_keep_alive` moved to `vllm.entrypoints.serve.utils` (#56369). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#56746"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "GLM-5.3-Flash: EPLB support (#55119), FlashKDA for KDA chunked prefill (1.7-3.8x faster than the Triton chunk path, #55737), dense and masked-MHA sparse prefill",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#55119"
            },
            {
              "label": "Model Support",
              "hardware": "Multimodal: torchcodec audio decoding and a selectable `audio_backend` in `--media-io-kwargs` (#51826) with automatic decoding kept soundfile-first (#55642), to",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#51826"
            },
            {
              "label": "Engine Core",
              "hardware": "Kernels: FlashInfer ReplaySSM backend for Mamba2 (#52506), B12X causal paged attention for SM120/SM121 via `--attention-backend B12X_ATTN` (#52017), FlashInfer ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52506"
            },
            {
              "label": "Engine Core",
              "hardware": "Robustness: attention implementations must explicitly declare DCP support (#55780), unavailable piecewise CUDA graphs raise instead of producing garbled output ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#55780"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: FlashInfer PCIe IPC all-reduce (#53576), DeepGEMM pinned to the vLLM fork 2.8.0 with SM120 and SM90 paged-MQA ports (#56876), public CUDA 13.4 Rubin bui",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#53576"
            }
          ]
        }
      },
      {
        "version": "v0.29.0",
        "badge": "Release",
        "date": "2026-09-09",
        "stats": "50 upstream changes and 337 PRs",
        "headline": "Model Runner V2 is now the default for all models, New models",
        "executive_summary": "vLLM v0.29.0 ships 50 upstream changes. Key highlights include: Model Runner V2 is now the default for all models (#53183), completing the rollout that began with pooling models (#48290). MRV2 also gained CUDA graph memory p; New models: Hy4-preview, Tencent's 770B/49B-active MoE with Gated DeepSeek Sparse Attention and native MTP (#54160); Qwen3.8-Flash-Next with BF16/FP8/NVFP4 and ; Kimi-K3 and DeepSeek V4 performance: fused MXFP4 top-k finalization in the K3 latent tail (about 5% E2E latency, #53152), K3 Mamba metadata preparation in one T.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53677",
                "#52980",
                "#52217"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Kernels: fused embedding kernel (#53677), FA4 re-enabled for head_size=256 on Blackwell (#52980), vectorized sparse MLA mask loads (#52217), masked MHA prefill for GLM-5...; RL workflows: `sharded_rdt` P2P weight sync (#43375), rank-local IPC updates (#52497), sparse checkpoint updates (#50723, #53751), gpt-oss routed expert loading (#52209),...; AMD ROCm: dual-stream decode with hipgraphs (#52033), W4A4 preshuffled asm GEMM by default (+15% throughput on Llama-3.3-70B MXFP4, #53141), ROCr/CLR update fixing graph...; Correctness: PaliGemma stale image scaling removed (#52692), Mistral3 placeholder grid with processor size overrides (#52874), MiniCPM-o on Transformers v5 (#54501), JinaVL...; NVIDIA: DeepSeek V3.2 / GLM-5.2 DSA routed to the optimized CUDA path on all GPUs (#52861), PCP for DSv3.2 sparse MLA (#52046), cuBLAS out_dtype router GEMM on all archs...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#52204",
                "#52018",
                "#47434"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "New backends: FlashInfer TRT-LLM MXFP8 linear (#52204), b12x FP4 MoE for SM120/SM121 (#52018), AutoRound block-wise FP8 (#47434), Humming MoE with MXFP4 weights + block-FP8...; `VLLM_TEST_FORCE_FP8_MARLIN` removed in favor of `--linear-backend` / `--moe-backend` (#52182); `VLLM_ROCM_USE_AITER_FP4_ASM_GEMM` removed (#53141); dead...; MoE communication: DeepEP v2 receiver CPU overhead (#51114) and MXFP8 activation scale dispatch (#51398), FlashInfer one-sided All2All refinements (#51924), DeepEP v2 fixes...; Fixes: weight-only NVFP4 checkpoints routed through W4A16 (#54427), compressed-tensors block FP8 with Marlin (#52966) and int8 grouped WNA16 MoE (#52002), OCP MX mxfp6...; Intel XPU: INC int4 W4A8 linear backend (#50501), AutoRound MXFP8 MoE (#51248), EC connector KV offloading (#49532), and fixes for HunyuanOCR XD-RoPE (#52174), sparse-MLA...",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47625",
                "#52185",
                "#50400"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "Multimodal performance: ViT full CUDA graph for Idefics3 and SmolVLM (#47625), packed encoder attention for Pixtral (#52185), fused Kimi vision Q/K RoPE kernel (#50400),...; Multimodal inputs: video embeds accepted by the Python frontend (#54242), modality-scoped `mm_processor_kwargs` honored (#53808), Qwen3-VL profiling honors...; New models: Hy4-preview (#54160), Qwen3.8-Flash-Next (#53896), GraniteSWA and GraniteMoeSWA via the existing Granite implementation (#52706), NemotronH_Omni_Reasoning_V3...; LoRA: DeepSeek V4 (#53361), Qwen3-Omni multimodal LoRA (#52786, #53557), tower/connector LoRA for LLaVA-NeXT (#49788) and LFM2-VL (#51498), plus fixes for Muse-Glimmer...; Data/pipeline parallel: PP silent corruption fix (#54962, #49274), DP coordinator wake handling (#51481), device sync on pause (#52914), TCPStore port fixes for Ray...",
              "config_snippet": ""
            },
            {
              "title": "Breaking Changes & Deprecations Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53608",
                "#54231",
                "#52131"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Breaking Changes & Deprecations Enhancements.",
              "now": "Ten deprecated architectures removed: Arctic, Chameleon, Cheers, Fairseq2Llama, FireRedLID, GritLM, HCXVision, MPT, the `RWForCausalLM` and `StableLMEpochForCausalLM` aliases,...; PyAV video decoder backend removed; use OpenCV or Torchcodec (#54231).; `python -m vllm.entrypoints.openai.api_server` is deprecated; use `vllm serve` (#52131).; FlexOlmo, Olmo3, Hunyuan V1 and Hunyuan VL are now served through the Transformers modeling backend (#53615).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Breaking Changes & Deprecations Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Ten deprecated architectures removed: Arctic, Chameleon, Cheers, Fairseq2Llama, FireRedLID, GritLM, HCXVision, MPT, the `RWForCausalLM` and `StableLMEpochForCausalLM` aliases, and `PrithviGeoSpatialMAE` (superseded by `T",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53608"
              },
              {
                "change": "Before You Upgrade",
                "impact": "FlexOlmo, Olmo3, Hunyuan V1 and Hunyuan VL are now served through the Transformers modeling backend (#53615). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53615"
              },
              {
                "change": "Before You Upgrade",
                "impact": "PyAV video decoder backend removed; use OpenCV or Torchcodec (#54231). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#54231"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`python -m vllm.entrypoints.openai.api_server` is deprecated; use `vllm serve` (#52131). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#52131"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Model Runner V2 is the default runner for all models (#53183). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53183"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Determinism: `trace_decode_token_ids` for deterministic decode replay (#46701), per-arch tuned batch-invariant matmul configs (about 3x decode kernels on RTX 40",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46701"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: dual-stream decode with hipgraphs (#52033), W4A4 preshuffled asm GEMM by default (+15% throughput on Llama-3.3-70B MXFP4, #53141), ROCr/CLR update fix",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52033"
            },
            {
              "label": "Quantization",
              "hardware": "New backends: FlashInfer TRT-LLM MXFP8 linear (#52204), b12x FP4 MoE for SM120/SM121 (#52018), AutoRound block-wise FP8 (#47434), Humming MoE with MXFP4 weights",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52204"
            },
            {
              "label": "API & Frontend",
              "hardware": "OpenAI compatibility: `logprobs=-1` in Completions (#46175), streamed logprob offsets with echo (#47815), batched chat echo (#52529), all choices returned from ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46175"
            },
            {
              "label": "Breaking Changes & Deprecations",
              "hardware": "Ten deprecated architectures removed: Arctic, Chameleon, Cheers, Fairseq2Llama, FireRedLID, GritLM, HCXVision, MPT, the `RWForCausalLM` and `StableLMEpochForCau",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#53608"
            }
          ]
        }
      },
      {
        "version": "v0.28.0",
        "badge": "Release",
        "date": "2026-08-26",
        "stats": "48 upstream changes and 190 PRs",
        "headline": "Kimi-K3 performance push, DeepSeek V4",
        "executive_summary": "vLLM v0.28.0 ships 48 upstream changes. Key highlights include: Kimi-K3 performance push: a major optimization effort for Kimi-K3 across the stack \u2014 Decode Context Parallel (DCP) support (#50484), fused FlashKDA decode and p; DeepSeek V4: sparse MLA now works end-to-end for plain decode, MTP, and DSpark speculative decoding (#51538), joined by AMD Quark NVFP4 support (#47972), reason; Speculative decoding advances: DFlash2 with local convolution and a candidate selector (#52816), DSpark confidence-scheduled verification (#47808), and async sc.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#50607",
                "#43615",
                "#47017"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "AMD ROCm: torch 2.12 / triton 3.7 stack bump (#50607), AITER and FP8 inference enabled on GFX120x (#43615), DeepSeek-V4 on gfx11 (#47017), optimized Triton sparse-MLA...; CPU: an MLA backend so DeepSeek-V2/V3 can run on CPU (#49453), a triton-cpu wheel (#52092), GPTQ and AWQ enabled on s390x (#51148) along with tcmalloc (#50841), BF16 MoE...; DeepGEMM pinned to the deepseek-ai nv_dev tip (#52035), DeepEP pinned by full commit hash (#52028), FlashAttention 3 built with the torch stable API (#49599).; MoE: extended EPLB support for Mistral Large 3 and additional MoE backends (#48355), CuTe DSL skinny GEMM extended to GLM-5.2 (#49791).; Transformers modeling backend: MLA support (#48250), hardware-agnostic model definition (#49458), fully generalized input embedding handling (#51247), logit softcapping...",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#49718",
                "#49792",
                "#50230"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "NVIDIA: FlashInfer XQA decode support on SM12x (#49718), a CuTeDSL fused query kernel on SM100 (#49792), programmatic dependent launch for the DSA decode kernels (#50230),...; Qwen: Qwen3.8 enabled on AMD ROCm (#50068), fused CUDA post-conv MTP decode kernel for Qwen3.5 GDN (#51674), GDN gates aligned with speculative tokens (#51812), and Qwen3.5...; Speculative decoding: DSpark confidence-scheduled verification (#47808), top-k DSpark Markov projection (#49969), DFlash2 with local convolution and a candidate selector...; Speculative decoding coverage: EAGLE3 support declared on KimiLinear (#52171), Qwen3.6 dSpark acceptance coverage (#51310).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#50833",
                "#51411",
                "#51038"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Fixes: dynamic INT8 W8A8 MoE config no longer built as W8A16 (#50833) and a TritonExperts crash (#51411), MXFP4 conversion for FlashInfer CUTLASS (#51038), fp32 weight...; New models: Muse Glimmer (#51655), Ling 3.0 Flash with BF16, MTP, and parser support (#51045) plus an FP8 variant (#51265) and hybrid MXFP4 routed experts (#52114), Dots3...; Correctness: MiniMax-M3 NVFP4 inference (#48929) and compressed-tensors FP8 MoE SwiGLU params (#46845), Gemma3n/Gemma4 variable-length audio batch padding (#50958), Gemma 4...; Intel XPU: a torch linear backend including blockwise GEMM (#49664, #50826), MXFP8 linear weights for the INC DeepSeek V4 model (#48476), async-scheduling PP sampled-token...; Online quantization: online MXFP4 support (#49347), online weight scales shared across TP (#49764), precision preserved in online NVFP4 expert packing (#50029), and the...",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38390",
                "#50390",
                "#52697"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "E/P/D disaggregation: Model Runner V2 E/P/D support (#38390), duplicate image preprocessing removed with GPU-side preprocessing (#50390), KV consumers may omit multimodal...; Hybrid/Mamba: prefix caching on by default (#50991), the final part of the Mamba attention module refactor (#44857), 3D-grid tiling of the state-copy Triton kernels...; RL workflows: stateful trainer send over NCCL and sparse NCCL (#50902), `CuMemAllocator.discard()` for tag-selective GPU memory release (#52514), level-2 sleep/wake/reload...; LoRA: vision tower LoRA for Gemma4 (#42662), tower/connector LoRA for Keye (#51780) and Ultravox (#48215).; Multimodal performance: fused on-device multimodal preprocess normalization (#50411), faster placeholder and token-match scanning (#50716), and repeated prompt-update scans...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "bitsandbytes support is now an out-of-tree plugin (#43529). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43529"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The deprecated `calculate_kv_scales` runtime KV scale calculation was removed (#49389). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#49389"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`override_attention_dtype` was removed (#48684). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#48684"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`reasoning_content` output removal is documented as a breaking client change (#50624). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#50624"
              },
              {
                "change": "Before You Upgrade",
                "impact": "KV offload tiering metrics renamed from `kv_offload_tiering_block_{queries,hits}` to `..._chunk_...` (#52812). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#52812"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: FlashInfer XQA decode support on SM12x (#49718), a CuTeDSL fused query kernel on SM100 (#49792), programmatic dependent launch for the DSA decode kernel",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49718"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: torch 2.12 / triton 3.7 stack bump (#50607), AITER and FP8 inference enabled on GFX120x (#43615), DeepSeek-V4 on gfx11 (#47017), optimized Triton spar",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#50607"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: an MLA backend so DeepSeek-V2/V3 can run on CPU (#49453), a triton-cpu wheel (#52092), GPTQ and AWQ enabled on s390x (#51148) along with tcmalloc (#50841),",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49453"
            },
            {
              "label": "API & Frontend",
              "hardware": "Anthropic API: 4xx returned for client-caused errors on `/v1/messages` (#52246), `disable_parallel_tool_use` preserved (#52021), and stop sequences bounded (#51",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52246"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: FlashInfer XQA decode support on SM12x (#49718), a CuTeDSL fused query kernel on SM100 (#49792), programmatic dependent launch for the DSA decode kernel",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49718"
            }
          ]
        }
      },
      {
        "version": "v0.27.0",
        "badge": "Release",
        "date": "2026-08-10",
        "stats": "42 upstream changes and 223 PRs",
        "headline": "Kimi K3 support, More new models",
        "executive_summary": "vLLM v0.27.0 ships 42 upstream changes. Key highlights include: Kimi K3 support with a full stack landing in one release: core model files and kernels (#50089, #50000), Python (#50093) and Rust (#50104) frontends, AttnRes ke; More new models: Qwen3.5 text-only dense and MoE models (#50210) with EVS video token pruning (#48912), K-EXAONE-2.0-750B-A37B (#50524), VaultGemma via the Tran; PyTorch 2.13.0 upgrade along with torchvision 0.28.0 and Triton 3.7.1 (#48155) \u2014 this is a breaking environment change; XPU (#48677) and CPU (#50412) followed t.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#46789",
                "#48957",
                "#49486"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "DeepSeek-V4: sequence parallelism (#46789), ~2x kernel skipping empty c128 launches (#48957), 3.4% E2E TTFT skipping topk/router in decode (#49486), 3.9% E2E TTFT workspace...; Attention: FlashAttention 4 SM100 FP8 KV cache (#42569) and headdim-256 (#42669); query replication for MLA decode under DCP for DeepSeek-V2/R1 and Kimi-K2.5 (#45964); masked...; ROCm: gfx1250 architecture enabled (#46516), AITER FP8 ViT encoder attention (#49937), fused shared expert for Quark DeepSeek-V4 checkpoints (#48044), Quark GLM-5.2 checkpoint...; Kimi K3: new model (#50000) with model files and kernels (#50089), Python frontend (#50093), Rust frontend (#50104), AttnRes kernels (#50090), DeepGEMM support (#50458), DSpark...; Transformers modeling backend: audio model support (#39330), improved `fx` tracer (#49957), fused residual-add + RMSNorm compilation pass (#48757), and fixes for MLA padding +...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#49750",
                "#48763",
                "#49618"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Kernels: RMSNorm uncontiguous support with 1.2\u20133.1x kernel improvement (#49750), MoE `reduce_scatter` regression fix restoring 5% E2E throughput (#48763), non-grouped bias-less...; New capabilities: FP4 Qutlass integration for compressed-tensors (#43229), CuTeDSL MoE for ReLU2 NVFP4 (#49580), MXFP8 linear support in INC (#47514), AutoRound W4A16 MoE and...; MoE refactor: FusedMoE renamed to FusedMoEFactory (#44941), MoeWNA16 migrated to the MK oracle scheme (#44120), Quark w8a8-int8 (#46765) and MXFP4 `aiter`/`emulation` backends...; Inkling: llm-compressor NVFP4 weights (#49258) and compressed-tensors dynamic FP8 (#48876).",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47750",
                "#48912",
                "#46837"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "Multimodal: VidCom2 video token pruning (#47750), EVS for Qwen3.5 (#48912), ViT CUDA graph for Gemma-4 (#46837), Cosmos3 FP8 ModelOpt/Diffusers remapping (#48952), MiniMax-M3...; New models: Qwen3.5 text-only dense and MoE (#50210), K-EXAONE-2.0-750B-A37B (#50524), VaultGemma via Transformers backend (#49803), jina-embeddings-v5-text-nano with EuroBERT...; UX & validation: standardized request error handling with a VLLMError hierarchy (#49665), reduced startup log noise (#50590), incompatible nested runtime overrides rejected...; Preprocessing performance: derender CPU work offloaded to the renderer thread pool (#49396), raw-prompt preprocessing off the event loop in AsyncLLM (#49608), multimodal...; Rust frontend: gRPC control plane with engine-aware health reporting (#48992), abort control RPC (#49255), server and model discovery (#49491), and KV event source discovery...",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#48637",
                "#50219",
                "#48577"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "CPU: INT8 fused MoE kernel for Arm CPUs (#48637), s390x inference optimization with oneDNN INT8 GEMM (#50219), GDN conv path optimized for speculative decoding (#48577),...; Spec decode: DSpark Markov head replicated across TP ranks (#49731), `sample_from_anchor` loaded from speculators config (#48639), earliest-completing stop string selected...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Models removed: Plamo2 (#49729), Ouro (#49786). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#49729"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed the no-longer-supported `max_num_partial_prefills` and `max_long_partial_prefills` arguments (#49244). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#49244"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "Multimodal: VidCom2 video token pruning (#47750), EVS for Qwen3.5 (#48912), ViT CUDA graph for Gemma-4 (#46837), Cosmos3 FP8 ModelOpt/Diffusers remapping (#4895",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#47750"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepSeek-V4: sequence parallelism (#46789), ~2x kernel skipping empty c128 launches (#48957), 3.4% E2E TTFT skipping topk/router in decode (#49486), 3.9% E2E TT",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46789"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Kernels: RMSNorm uncontiguous support with 1.2\u20133.1x kernel improvement (#49750), MoE `reduce_scatter` regression fix restoring 5% E2E throughput (#48763), non-g",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49750"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "ROCm: gfx1250 architecture enabled (#46516), AITER FP8 ViT encoder attention (#49937), fused shared expert for Quark DeepSeek-V4 checkpoints (#48044), Quark GLM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46516"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: INT8 fused MoE kernel for Arm CPUs (#48637), s390x inference optimization with oneDNN INT8 GEMM (#50219), GDN conv path optimized for speculative decoding ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#48637"
            }
          ]
        }
      },
      {
        "version": "v0.26.0",
        "badge": "LTS Milestone",
        "date": "2026-07-27",
        "stats": "411 commits from 212 contributors",
        "headline": "Tiered KV Cache Offloading to Object Storage, Per-Layer Attention Backends, and Inkling Family Support",
        "executive_summary": "vLLM 0.26.0 matures tiered KV cache offloading (extending GPU HBM -> CPU DRAM -> Object Storage with workload identity), allows hybrid models to select different attention backends per KV-cache group, and ships a native Rust `vllm-bench` CLI alongside multimodal video/audio support in the Rust frontend.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Tiered KV Offloading to CPU & Cloud Object Storage",
              "status": "Opt-in / Beta",
              "status_tone": "green",
              "prs": [
                "#47063",
                "#47987",
                "#47666"
              ],
              "before": "When prefix cache blocks were evicted from GPU HBM, they were lost once local host DRAM filled up\u2014forcing expensive prefill recomputation across DP replicas.",
              "now": "Introduces a secondary object-store tier with cloud workload identity, DP-replica-aware tiering, and granular read/write latency histograms.",
              "config_snippet": "vllm serve meta-llama/Llama-3.3-70B-Instruct --kv-transfer-config '{\"kv_connector\":\"TieredOffloadConnector\"}'"
            },
            {
              "title": "Per-KV-Group Attention Backends for Hybrid Models",
              "status": "Default / GA",
              "status_tone": "cyan",
              "prs": [
                "#48012",
                "#48011"
              ],
              "before": "Hybrid architectures mixing sliding-window attention, full attention, and Mamba/linear layers were forced to use a single compromise attention backend across the whole model.",
              "now": "vLLM selects the optimal kernel backend independently for each KV-cache group in the model.",
              "config_snippet": "# Automatically enabled for hybrid sliding-window + full-attention models"
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Turn Agent & RAG Platforms",
              "models": "All long-context models with high prefix reuse",
              "gpus": "Multi-replica GPU clusters backed by fast object/NVMe storage",
              "impact": "Avoids recomputing 50K+ token system/repo contexts across independent serving pods."
            }
          ],
          "jargon_decoded": [
            {
              "term": "KV Offloading & Prefix Caching",
              "plain_english": "Saving the mathematical state (Keys and Values) of a processed prompt to cheaper memory (CPU RAM or storage) so the next request with the same prefix skips prompt processing.",
              "bottom_line": "Slashes Time-to-First-Token (TTFT) and GPU compute waste on repeated system prompts and codebases."
            }
          ],
          "upgrade_guide": {
            "verdict": "Safe Drop-In Upgrade \u2014 Also includes 6 important security hardening fixes.",
            "rows": [
              {
                "change": "`diskcache` replaced to eliminate `pickle` deserialization",
                "impact": "Old local diskcache directories are ignored and regenerated safely.",
                "action": "No config change needed; improves security posture automatically.",
                "pr": "#44549"
              },
              {
                "change": "Legacy TeleChat, Persimmon, and Fuyu model implementations removed",
                "impact": "Those 3 legacy architectures are no longer built-in.",
                "action": "Use the Transformers modeling backend if still serving those checkpoints.",
                "pr": "#47989"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "DeepSeek-V4 Fused Top-K Bias & Routing Kernel",
              "hardware": "NVIDIA Hopper H100 / H200",
              "metric": "1.5\u00d7\u20132.0\u00d7 routing kernel speedup",
              "pct_bar": 78,
              "pr": "#47463"
            }
          ]
        }
      },
      {
        "version": "v0.25.0",
        "badge": "Release",
        "date": "2026-07-11",
        "stats": "49 upstream changes and 204 PRs",
        "headline": "Model Runner V2 is now the default for all dense models, PagedAttention has been removed",
        "executive_summary": "vLLM v0.25.0 ships 49 upstream changes. Key highlights include: Model Runner V2 is now the default for all dense models (#44443). Building on quantized-model support from the previous release, MRv2 is now the standard execut; PagedAttention has been removed (#47361). The legacy attention implementation is deleted now that V1/MRv2 backends are the standard path.; The Transformers modeling backend is now as fast as native vLLM (#47187), and gained FP8 MoE support (#46820), CUDA graph + embed scaling fixes (#48010), and mi.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#46862",
                "#46635",
                "#46876"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "GLM-5.2 / DeepSeek: `fused_indexer_q_rope_quant` Triton kernel (1.9\u20133.3% E2E throughput) (#46862), reduce-scatter MoE all-reduce (3.1\u20133.2% E2E) (#46635), op fusion for...; AMD/ROCm: moved to torch 2.11 stable ABI (#47128); AITER FlashAttention MLA prefill backend `ROCM_AITER_FA` (#45033); fused shared-expert for GLM-4.5/6/7 (#44313) and...; NVIDIA/Blackwell: FlashInfer fused all-reduce tuned for world_size=16 on GB300 (#46392), restored NVFP4 swizzled-scale zero-init to recover Blackwell decode throughput...; GLM-5 family: GLM-5 / DeepSeek-V3.2 added to the model zoo (#46808), GLM-5.2 FP32 gate (#47410), GLM MTP post-final-norm fix (#47448), GLM4V startup fix (#47155).; PD disaggregation: secondary-tier implementation (#42285), Mooncake connector GDN (Qwen3.5) + MLA (DeepSeek-V4-Flash) support (#46807), NIXL Mamba1 support (#45019),...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#44514",
                "#46783",
                "#46655"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Deprecated the old FP8 online MoE quantization class (#44514); legacy `api_server.py` moved to the examples directory (#46783); `gptq_marlin` removed from supported ROCm quant...; ROCm: stabilized high-throughput DBO for DP+EP (#46990), EPLB for Quark OCP MXFP4 MoE (#47220).; FP8: weights padding for per-block online quantization (#44763); deprecated the old FP8 online MoE quantization class (#44514).; Fixes: W8A8 int-quant scheme-selection regression (#46860), tied quantized embeddings for ModelOpt Gemma4 (#45544), NVFP4+MTP crash on Qwen3Next (#46316), ModelOpt...; NVFP4: fused weight dequantization with compute in the MoE MLP Triton kernel (#44667), NVFP4 KV cache with skip-layers sliding window (#42890), MiniMax-M3 ModelOpt NVFP4...",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47187",
                "#46820",
                "#48010"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Transformers backend: now as fast as native vLLM (#47187), FP8 MoE fix (#46820), embed scaling + CUDA graph fix (#48010), GPTBigCode/Starcoder2 (#30966) and RoBERTa (#47452)...; Model Runner V2: default for all dense models (#44443); EVS (#46535), realtime embeddings (#46762), Mamba hybrid prefix caching (#42406), multimodal-prefix bidirectional...; Intel XPU: W8A8 FP8 linear kernel with multi-granularity quant (#43645), pipeline-parallel accuracy fix (#47253), uniform-batch CUDA graph for FA2 (#46555), route mm_prefix...",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47217",
                "#47332",
                "#47091"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "Gemma family: Gemma4 sliding-window/FA4 attention fixes (#47217, #47332), Gemma4 MTP quant_config fix (#47091); DiffusionGemma tensor parallelism (#45719) and HF...; Speculative decoding: universal spec decode for heterogeneous vocabularies (TLI) (#38174); DSpark drafter + speculators checkpoint support (#46995, #47093); DFlash backend...; Data parallel: throttle prefills based on local prefill work (#46532), rotate load-balancer tie-break to avoid engine bias (#47420), DP supervisor via the Rust frontend...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "PagedAttention deleted (#47361). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#47361"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Models removed: Baichuan (#46362), Aquila (#46605), Grok (#46706), Tarsier / Tarsier2 (#47143), AyaVision / MusicFlamingo (#47263), Mantis (#46806). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#46362"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated the old FP8 online MoE quantization class (#44514); legacy `api_server.py` moved to the examples directory (#46783); `gptq_marlin` removed from supported ROCm quant schemes (#46655). -> Action: Check deprecati",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44514"
              },
              {
                "change": "Security",
                "impact": "Prevent image decompression-bomb OOM denial of service (#47010).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#47010"
              },
              {
                "change": "Security",
                "impact": "Prevent an infinite loop in `split_audio` with NaN audio samples (#46463).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#46463"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "GLM-5.2 / DeepSeek: `fused_indexer_q_rope_quant` Triton kernel (1.9\u20133.3% E2E throughput) (#46862), reduce-scatter MoE all-reduce (3.1\u20133.2% E2E) (#46635), op fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46862"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA/Blackwell: FlashInfer fused all-reduce tuned for world_size=16 on GB300 (#46392), restored NVFP4 swizzled-scale zero-init to recover Blackwell decode thr",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46392"
            },
            {
              "label": "API & Frontend",
              "hardware": "CLI/UX: TTFT and TPS printing in `vllm chat` (#46775), `model_class_overrides` for development/debugging (#47148).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46775"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "GLM-5.2 / DeepSeek: `fused_indexer_q_rope_quant` Triton kernel (1.9\u20133.3% E2E throughput) (#46862), reduce-scatter MoE all-reduce (3.1\u20133.2% E2E) (#46635), op fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46862"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD/ROCm: moved to torch 2.11 stable ABI (#47128); AITER FlashAttention MLA prefill backend `ROCM_AITER_FA` (#45033); fused shared-expert for GLM-4.5/6/7 (#4431",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#47128"
            }
          ]
        }
      },
      {
        "version": "v0.24.0",
        "badge": "Release",
        "date": "2026-06-29",
        "stats": "42 upstream changes and 242 PRs",
        "headline": "MiniMax-M3, DeepSeek-V4 keeps maturing",
        "executive_summary": "vLLM v0.24.0 ships 42 upstream changes. Key highlights include: MiniMax-M3: Added support for the new MiniMax-M3 model (#45381), with a fast follow-on of BF16/FP8 indexer via MSA (#45892), MXFP4 support (#45896), FP8 sparse ; DeepSeek-V4 keeps maturing: Following its debut, DeepSeek-V4 received another large optimization pass \u2014 a FlashInfer sparse index cache (2\u20134% TTFT) (#45863), pr; Model Runner V2 (MRv2) continues to expand: MRv2 now supports quantized models by default (#44446), enables GraniteMoE by default (#45461), and gained migration.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#45131",
                "#45161",
                "#46636"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "Deprecated: First-generation Qwen and QwenVL models (#45131), Transformers v4 support (#45161), `CUDA_VISIBLE_DEVICES` on ROCm (#46636); general deprecations for...; AMD ROCm: Torch 2.11 (#45362); fused AR + RMSNorm + per-group FP8 quant (#42864), fused softplus-sqrt-topk MoE router under AITER (#44945), DSv4 flash-decode split-K kernel...; Torch 2.11 on ROCm (#45362), torch-xpu 2.12 (#42262), tpu-inference v0.22.1 (#45793), NIXL v0.10.1 for XPU (#40287), Starlette \u2265 1.0.1 (#45675).; Weight loading & core: fastsafetensors `ParallelLoader` for weight loading (#40183), release of cached device memory under pressure on UMA GPUs (#45179), structured outputs...; TPU: tpu-inference upgraded to v0.22.1 (#45793).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#44572",
                "#44830",
                "#45322"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "NVIDIA / kernels: SM90 CUTLASS FP8 mm odd-M support via swap_ab (180\u2013290% kernel speedup) (#44572), tuned `fused_moe` FP8 for Qwen3-Next-80B on H100 (+25%) (#44830), native...; torch stable ABI: Continued (and completed) migration of kernels to the libtorch stable ABI \u2014 MoE [10c/n] (#44565), Marlin [11a/n] (#45176), Machete [11b/n] (#45304), final...; Expert parallel: DeepEP v2 integration (#41183) with token-bound and topk-index fixes (#46404, #46432); NIXL EP \u2014 DBO with NIXL EP (#45275), top-k index dtype query...; FP4 / MXFP: FlashInfer cutedsl NVFP4 GEMM backend (#42235) and cute-dsl MXFP8 linear kernel (#46393), MXFP4 W4A4 MoE CUTLASS E8M0 scale fix (#43557), SwiGLU clamp wired for...; Kernels & correctness: QuantizedActivation linear-kernel contract (#44260), consolidated Marlin thread-tile padding (#45295), FP8 weight layout canonicalized to (K, N)...",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#45381",
                "#45163",
                "#45690"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "New models: MiniMax-M3 (#45381), DiffusionGemma (#45163) + Gemma Diffusion on CPU (#45690), Hierarchical Reasoning Model \u2014 Text / HrmTextForCausalLM (#43098), OpenMOSS...; Qwen / multimodal: Qwen3-VL video loader (#44412), Qwen2-VL/Qwen2.5-VL processor-mapped video loader (#45555), Qwen3-VL multi-video processing optimization (#46026) and...; Model Runner V2: Quantized models by default (#44446), GraniteMoE default (#45461), Qwen/DSv2 MoE migration (#42667), DFlash (#44586), simplified async output handling...; Gemma 4: Unified FlashAttention (FA4) across all layers + `mm_prefix` support (#42175); many parser/serving fixes \u2014 forced-JSON skip for required/named tool choice...; Tool calling & parsing: Strict mode for tool calling in Chat Completions (#45003) and Responses API (#45396); new Streaming Parser Engine (#45413) with Qwen3, MiniMax-M2...",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40576",
                "#43586",
                "#41992"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "ViT full CUDA graph: GLM-4.1V (#40576), DeepSeek-OCR dual-path (#43586), Kimi-VL (#41992), mllama4 (#40660), Lfm2VL encoder (#44930).; Attention: Re-enabled cross-layer KV cache layout for MLA via stride-aware kernels (#45111), MLA prefill FA4 fp8 output (#43050), FlexAttention custom mask mods made fully...; Intel XPU: Sequence-parallel support (#38608), torch-xpu 2.12 (#42262), vllm-xpu-kernels v0.1.10 (#40367), W4A16 int4 group_size=32 MoE (#45136), DeepSeek-V4 attention/MoE...; DeepSeek-V4: OOM fix (#44914), MTP projection prefixing (#44821), supported KV-cache dtypes (#44892).; Kernels: GLM-5 TRT-LLM ragged MLA prefill dimensions (#43525), GLM-5 router GEMM (#46385).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed models: ERNIE (obsolete) (#45127), Xverse (#45638), Dots1 (#45637), Bamba (#45990), Mono-InternVL (#45129), InternLM registry alias (#45128). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#45127"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated: First-generation Qwen and QwenVL models (#45131), Transformers v4 support (#45161), `CUDA_VISIBLE_DEVICES` on ROCm (#46636); general deprecations for v0.23/v0.24 (#44992). -> Action: Check deprecation/removal",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#45131"
              },
              {
                "change": "Security",
                "impact": "Denial of service: Audio decompression bomb in the speech-to-text endpoint (#44970), remote DoS via invalid recovered-token reinjection in speculative decoding (#44744), DoS via `prompt_embeds` on M-RoPE models (#45252),",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44970"
              },
              {
                "change": "Security",
                "impact": "Input validation & hardening: Image EXIF orientation and tRNS transparency handling (#44974), rejection of non-finite `temperature`/`repetition_penalty` (#45116), `sanitize_message` applied to Anthropic and STT error pat",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44974"
              },
              {
                "change": "Security",
                "impact": "Information disclosure: int32 truncation in the GGUF dequantize kernels (#44971).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44971"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "CPU & other architectures: 2.5\u00d7 faster ASR CPU preprocessing via multi-threading (#44612), CPU W4A16 INT4 MoE (#43409), cgroup memory-limit-aware KV cache sizin",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44612"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA / kernels: SM90 CUTLASS FP8 mm odd-M support via swap_ab (180\u2013290% kernel speedup) (#44572), tuned `fused_moe` FP8 for Qwen3-Next-80B on H100 (+25%) (#44",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44572"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "torch stable ABI: Continued (and completed) migration of kernels to the libtorch stable ABI \u2014 MoE [10c/n] (#44565), Marlin [11a/n] (#45176), Machete [11b/n] (#4",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44565"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU & other architectures: 2.5\u00d7 faster ASR CPU preprocessing via multi-threading (#44612), CPU W4A16 INT4 MoE (#43409), cgroup memory-limit-aware KV cache sizin",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44612"
            }
          ]
        }
      },
      {
        "version": "v0.23.0",
        "badge": "Release",
        "date": "2026-06-15",
        "stats": "40 upstream changes and 224 PRs",
        "headline": "DeepSeek-V4 matures across backends, Model Runner V2 expands to more dense models",
        "executive_summary": "vLLM v0.23.0 ships 40 upstream changes. Key highlights include: DeepSeek-V4 matures across backends: Following its introduction in v0.22.0, DeepSeek-V4 received another large hardening and optimization pass. Its sparse MLA m; Model Runner V2 expands to more dense models: MRv2 is now selected by default for Llama and Mistral dense models (#43458) in addition to Qwen3. It gained a Flas; Rust frontend grows up: The experimental Rust frontend added a streaming `generate` endpoint (#43779), dynamic LoRA endpoints (#43778), `/version` (#43854) and .",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#43361",
                "#43717",
                "#44013"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "torch stable ABI: Continued migration of kernels to the libtorch stable ABI \u2014 merge_attn_states/mamba/sampler [8/n] (#43361), attention/cache kernels [9/n] (#43717), header...; Model fixes & enhancements: Qwen3-VL/Qwen3-omni-thinker deepstack accuracy under `torch.compile` (#43617), EVS for Qwen3-VL (#44205), GLM-5.1 PP loading (#42944), GLM-4.1V...; Attention & hybrid/Mamba: FlexAttention/FlashAttention num-blocks-first layouts (#42095), OOT MLA prefill backend registration (#43325), FlashAttention upstream sync...; Intel XPU: vllm-xpu-kernel v0.1.7 (#41019), `block_fp8_moe` (#42139), block-scaled W8A8 FP8 path (#39968), WNA16 oracle for GPTQ sym-int4 (#41426), rms_norm/act quant...; Parsers: Unified reasoning + tool-call parsing behind `Parser.parse()` (#44267), Responses parser migrated to the unified interface (#42977), unstreamed tool-arg flush...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38065",
                "#44220",
                "#43706"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "NVIDIA / kernels: FP8 FlashInfer attention for ViT (#38065), Triton MoE backend on Hopper by default (#44220), CUTLASS FP8 scaled-mm padding bypass (+20%) (#43706),...; Kernels & backends: Triton W4A16 as CUDA fallback for non-Marlin-aligned shapes (#43731), Marlin MoE on SM 12.x (#40923), Machete W4A16 tests (#35450), fail-fast for...; compressed-tensors: WNA8O8Int linears and WNInt embeddings (#44340), asymmetric MoE WNA16 Marlin (#44025), single-class NVFP4 linear refactor (#42443).; MoE refactor (oracle): Migrated ModelOpt MXFP8 (#42768), W4A8-int8 (#42789), and WNA16 backend selection (#42553) into the modular-kernel oracle; removed...; CPU & other architectures: zentorch-accelerated W8A8/W4A16 on AMD Zen CPUs (#41813), CPU top-k/top-p Triton sampling (#43633), non-divisible GQA decode in mixed batches...",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#43720",
                "#44560",
                "#42554"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "KV connectors / disaggregated serving: PP-aware handshake aggregation and intermediate-PP output plumbing (#43720), multiple-async-KV-load deadlock fix (#44560), Nixl Mamba...; EPLB: Async EPLB by default (#43219), EPLB for DeepSeek-V4 Mega-MoE (#43339), Nixl zero-copy EPLB transfers (#41633).; Begin the deprecation cycle for the NixlConnector `kv_both` role (#43874).; OpenAI / Responses API: `system_fingerprint` field (#40537), streaming tool/function calling with `required` (#40700), `chat_template_kwargs` in Responses (#43761),...; Refactor: AutoWeightsLoader for InternLM2 (#38278).",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#44429",
                "#43241",
                "#43798"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "Gemma 4: Encoder-free Unified support (#44429), MTP (#43241), native ViT linear layers (#43798), vision-embedder excluded from quantization (#44571), and fixes for MTP...; New models: Step-3.7-Flash (#43859), Cosmos3 Reasoner (#43356), Gemma 4 Unified encoder-free (#44429), JetBrains Mellum v2 (#43992), Granite Speech Plus (#43519), Cohere...; Multimodal: Auto-select registered video loader for VLMs (#44126), O(log n) multimodal item handling per step (#44212), local image encoding in benchmarks (#43843),...; Pooling/Classification: Proper exceptions for pooling UX (#44593), `extra_repr()` for pooler classes (#44805), LoRA-adapter-name pooling fix (#44410), resettled generative...; Rust frontend: Streaming `generate` endpoint (#43779), dynamic LoRA endpoints (#43778), `/version` (#43854) and `/server_info` (#43942), server-router extension hook...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Deprecate `JAISLMHeadModel` (#43784). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43784"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Begin the deprecation cycle for the NixlConnector `kv_both` role (#43874). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43874"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Remove functions previously scheduled for deprecation in v0.21.0 (#43358). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43358"
              },
              {
                "change": "Security",
                "impact": "Parameter validation: Reject invalid `thinking_token_budget` values (#43402), non-positive `ParallelConfig` integer knobs (#44057), zero-valued config fields (#43794), and out-of-range `max_num_scheduled_tokens` (#44207)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43402"
              },
              {
                "change": "Security",
                "impact": "Untrusted-input hardening: Reject out-of-vocabulary token IDs before they reach the GPU logprob path (#44042) and fix a UTF-8 char-boundary panic in the Rust incremental detokenizer on malformed input (#44620), both of w",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44042"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "torch stable ABI: Continued migration of kernels to the libtorch stable ABI \u2014 merge_attn_states/mamba/sampler [8/n] (#43361), attention/cache kernels [9/n] (#43",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#43361"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA / kernels: FP8 FlashInfer attention for ViT (#38065), Triton MoE backend on Hopper by default (#44220), CUTLASS FP8 scaled-mm padding bypass (+20%) (#437",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#38065"
            }
          ]
        }
      },
      {
        "version": "v0.22.0",
        "badge": "Release",
        "date": "2026-05-29",
        "stats": "50 upstream changes and 197 PRs",
        "headline": "DeepSeek V4 maturity, Model Runner V2 advances toward default",
        "executive_summary": "vLLM v0.22.0 ships 50 upstream changes. Key highlights include: DeepSeek V4 maturity: DeepSeek V4 received a major hardening pass this cycle \u2014 the model was reorganized into a dedicated `vllm/models/deepseek_v4/` package (#4; Model Runner V2 advances toward default: MRv2 is now default for Qwen3 dense models. vLLM will fall back to MRv1 for features that aren't yet supported in MRv2 ; Experimental Rust frontend: A new Rust front-end integration landed (#40848), with the implementation moved into the tree (#43283) and a DP Supervisor for data-.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40082",
                "#41215",
                "#38822"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "NVIDIA Blackwell / SM12x: FlashInfer b12x MoE + FP4 GEMM for SM120/121 (#40082), per-tensor FP8 CUTLASS on SM12.1 (#41215), `head_dim=512` for FlashInfer TRTLLM attention...; Performance: batch-invariant Cutlass FP8 (+28.9% E2E) (#40408), CutlassFP8 padding pre-processing (+13.5% TTFT) (#42651), padded NVFP4 quant kernel (+2.4\u20135.7% E2E)...; CPU / RISC-V: RVV-optimized attention kernels for RISC-V Vector Extension (#40119) with VLEN=256 (#42943), fused GDN for AMX CPU (#42707), MXFP4 W4A16 MoE (#41922),...; Intel XPU: GPTQ int4 support (#37844), mxfp8 MoE (#41918), FP8 block-scaled quantization (#42952), custom-op collective behavior (#41354), multiple sparse-attention kernels...; NVFP4: DeepSeek V4 fused MoE (#42209), ModelOpt W4A16 NVFP4 fused MoE + mixed-precision dispatch (#42566), batch-invariant NVFP4 Cutlass linear (#39912), FlashInfer TRTLLM...",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#42209",
                "#42604",
                "#43385"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "DeepSeek V4: NVFP4 MoE (#42209), CUDA graph full/piecewise (#42604), MTP (#43385), model package refactor (#43004, #43039, #43073, #43077), sparse MLA + compressor refactor...; Tool calling: Apertus tool parser (#41154), Qwen3Coder `anyOf`/`oneOf`/`$ref` resolution re-land (#37831), shared `coerce_to_schema_type` across MiniMax-M2 / DeepSeek-V3.2 /...; Kimi-K2.5: skip vision-tower dtype conversion under quantization (#42869), `mm_projector` dtype fix (#42081).; Removed deprecated MLA prefill arguments (#42555).",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#41383",
                "#40364",
                "#41869"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "Disaggregated serving (NIXL): lease-renewal TTL for KV blocks on P (#41383), handshake-failure policy honoring (#40364), GDN support for PD with NIXL (#41869), multi-node TP>8...; EPLB: change default EPLB communicator (#43110), VLM-wrapper init fix (#39805), remove dead `torch.accelerator.synchronize()` (#40733).; MoE refactor: `ExpertMapManager` (#41046), experts moved to `experts/` (#42334), `RoutedExperts` alias for FusedMoE (#40735), EPLB refactoring for FusedMoE (#41055).; Mamba: attention module refactor (#41126), Mamba2 SSD kernel warmup (#39822), bf16 SSM cache (#41680), GPU-side state postprocessing fused kernel (#40172), run single-token...; Rust frontend: integration (#40848), in-tree code move (#43283), utility call-ID newtype (#43405), simplified `AuthenticationMiddleware` path extraction (#43426).",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#42311",
                "#36329",
                "#42151"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Qwen3.5/3.6: GDN output-projection flatten (#42311), GatedDeltaNet Marlin TP\u22652 fix (#36329), ViT full CUDA graph (#42151), runai-streamer weight loading for...; Model Runner V2: Qwen3-dense-by-default oracle (#39337), sleep-mode reload weights (#42673), `update_config` (#42783), shared KV-cache layers (#35045), FP32 gumbel sampling...; Experimental: breakable CUDA graph (#42304).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed old locations of `get_tokenizer` and `resolve_hf_chat_template` (#35024). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35024"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Marked env vars now covered by `--moe-backend` / `--linear-backend` (#43148). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43148"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated MLA prefill arguments (#42555). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#42555"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed dead CUDA kernels and dead code (#42767, #42889, #43144). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#42767"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA Blackwell / SM12x: FlashInfer b12x MoE + FP4 GEMM for SM120/121 (#40082), per-tensor FP8 CUTLASS on SM12.1 (#41215), `head_dim=512` for FlashInfer TRTLLM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40082"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: batch-invariant Cutlass FP8 (+28.9% E2E) (#40408), CutlassFP8 padding pre-processing (+13.5% TTFT) (#42651), padded NVFP4 quant kernel (+2.4\u20135.7% E",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40408"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: DSV4 functionality + accuracy fixes (#42810, #43679 Tilelang MHC), flash sparse MLA Triton kernels (#41812), gluon paged MQA logits on gfx950/MI355X (",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#42810"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA Blackwell / SM12x: FlashInfer b12x MoE + FP4 GEMM for SM120/121 (#40082), per-tensor FP8 CUTLASS on SM12.1 (#41215), `head_dim=512` for FlashInfer TRTLLM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40082"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: batch-invariant Cutlass FP8 (+28.9% E2E) (#40408), CutlassFP8 padding pre-processing (+13.5% TTFT) (#42651), padded NVFP4 quant kernel (+2.4\u20135.7% E",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40408"
            }
          ]
        }
      },
      {
        "version": "v0.21.0",
        "badge": "Release",
        "date": "2026-05-15",
        "stats": "49 upstream changes and 136 PRs",
        "headline": "Transformers v4 deprecated, C++20 build requirement",
        "executive_summary": "vLLM v0.21.0 ships 49 upstream changes. Key highlights include: Transformers v4 deprecated: This release formally deprecates `transformers` v4 support (#40389). Users should migrate to `transformers` v5.; C++20 build requirement: vLLM now requires a C++20-compatible compiler for compatibility with PyTorch (#40380). This is a breaking build change.; KV Offload + Hybrid Memory Allocator (HMA): The KV offloading subsystem now integrates with the Hybrid Memory Allocator, including scheduler-side sliding window.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40376",
                "#38065",
                "#40941"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Performance: FlashInfer top-k/top-p sampler enabled by default (#40376), FP8 FlashInfer attention for ViT (#38065), TurboQuant shared dequant buffers (#40941),...; DeepSeek V4: AMD/ROCm support (#40871), pipeline parallelism (#41694), `max` reasoning effort (#40982), disaggregated serving fixes (#41957).; NVIDIA Blackwell: TOKENSPEED_MLA backend for DSR1/Kimi-K25 (#41778), faster per-token FP8 group quant packed kernel (#41326), FP8 on NVIDIA Thor/SM110 (#39712), CUTLASS...; AMD ROCm: ROCm 7.2.2 (#41386), DBO (Dynamic Batch Optimization) (#34726), AITER Fused Allreduce+RMSNorm (#37646), Fused Shared Expert (FSE) for Qwen3-Next (#39280),...; MLA: Abstracted MLA prefill backends, eliminated cuDNN dependency (#32623).",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40967",
                "#41129",
                "#41880"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "New architectures: MiMo-V2.5 (#40967), Laguna XS.2 (#41129, #41880), Moondream3 (#32325), Qianfan-OCR (#40136), Cohere MoE (#40817), Cohere Eagle (#42078).; Speculative decoding: EAGLE for Mistral (#41024), Gemma4 MTP (#41745), MTP for MiMo-V2.5 (#41905), Cohere Eagle (#42078).; Speculative decoding: Thinking budget support (#34668), independent drafter attention backend selection (#39930), multimodal model support with warning (#41752), per-step...",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#41228",
                "#41445",
                "#39571"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "KV offloading + HMA: Scheduler-side sliding window groups (#41228), full HMA enablement (#41445), multi-connector HMA (#39571), per-job store completion (#39186), DCP/PCP...; Disaggregated serving: Bi-directional KV cache transfers between P and D (#32553), NIXL transfer redesign (#40731), EPLB memory overhead optimization (#40013), NIXL connector...; Ray: RayExecutorV2 enabled by default (#41421), actor name collision fix for DP > 1 (#40398).; Compatibility: Vendor HCXVisionConfig for Transformers v5 (#38447), legacy `rope_type` checkpoint support (#41734).; NIXL connector bumped to 1.x (#42364).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#39445",
                "#41186",
                "#41314"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "CPU: FP8 attention for AMX/AVX-512 (#39445), FP8 W8A16 linear (#41186), FP8 W8A16 MoE (#41314), DNNL AVX2 W8A8 Int8 (#41318), Gated DeltaNet Attention for Qwen 3.5/3.6...; NVFP4: KV cache support (#40177), Triton dequant/QDQ emulation kernels for Hopper and AMD (#40033), GELU on TRT-LLM NvFP4 fused MoE for Gemma4 (#41050), ModelOpt NVFP4...; MXFP4: Humming MXFP4 MoE backend (#41083), FlashInfer CUTLASS MXFP4-MXFP8 MoE fix (#42089).; FP8: Bias loading fix (#41424), FlashInfer autotune temporarily disabled for correctness (#41524).; TurboQuant: Hybrid model and uniform quantization support (#39931).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "API & Frontend",
                "impact": "Responses API: Streaming tool/function calling with `required` (#40700) and named tool/function choice (#41110), resubmitting output items with missing fields (#41355).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#40700"
              },
              {
                "change": "Build & Dependencies",
                "impact": "Breaking: C++20 required for PyTorch compatibility (#40380).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#40380"
              },
              {
                "change": "Build & Dependencies",
                "impact": "Breaking: Transformers v4 deprecated (#40389).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#40389"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: FlashInfer top-k/top-p sampler enabled by default (#40376), FP8 FlashInfer attention for ViT (#38065), TurboQuant shared dequant buffers (#40941), ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40376"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: FlashInfer top-k/top-p sampler enabled by default (#40376), FP8 FlashInfer attention for ViT (#38065), TurboQuant shared dequant buffers (#40941), ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40376"
            }
          ]
        }
      },
      {
        "version": "v0.20.0",
        "badge": "Release",
        "date": "2026-04-27",
        "stats": "57 upstream changes and 315 PRs",
        "headline": "DeepSeek V4, CUDA 13.0 default",
        "executive_summary": "vLLM v0.20.0 ships 57 upstream changes. Key highlights include: DeepSeek V4: Initial DeepSeek V4 support landed (#40860), with DSML token-leakage fix in DSV4/3.2 (#40806), DSA + MTP IMA fix (#40772), and a silu clamp limit o; CUDA 13.0 default: Default CUDA wheel on PyPI and `vllm/vllm-openai:v0.20.0` image switched to CUDA 13.0; architecture lists and build-args cleaned up (#39878),; PyTorch 2.11 upgrade (#34644): vLLM ships on torch 2.11 for CUDA, and XPU is now also on torch 2.11 (#37947) \u2014 XPU is no longer pinned to 2.10. This is a breaki.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#37980",
                "#39422",
                "#39083"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Other: DeepGEMM integrated into the vLLM wheel via CMake (#37980), Lustre FS checkpoint prefetching enabled by default (#39422), Gemma4 fused routing Triton kernel...; New formats & methods: TurboQuant 2-bit KV cache compression (#38479) with FA3/FA4 prefill (#40092), per-token-head INT8/FP8 KV cache quantization (#38378), fused FP8/NVFP4...; Intel XPU: torch 2.11 upgrade for XPU (#37947) \u2014 no longer pinned to 2.10, initial GDN attention for Qwen3-Next / Qwen3.5 (#33657), torch.compile for XPU GDN attention...; Petit NVFP4 (#32694), `accept output buffer` in attention (#39125), `cprofile` / `cprofile_context` (#39100), `LLM.reward` offline API (#40688).; Deprecations: Petit NVFP4 removed (#32694).",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38635",
                "#37123",
                "#38663"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Features: NUMA binding for GPU workers (#38635), opt-in `VLLM_MEDIA_CACHE` media URL caching (#37123), safe request abort when FSM fails to advance (#38663), KV connector...; Model Runner V2: Full CUDA graph for eagle prefill (#37588), auto cudagraph mode/sizes based on attention backend (#32936), fused probabilistic rejection-sample kernels...; torch.compile: Opaque Objects on torch 2.11 (#39286), AOT compile with batch-invariance mode (#39201), Inductor cache nested under AOT dir (#39718), split FX graph via...; Helion kernels: torch.compile support for Helion kernels (#38592).; Transformers v5 (#30566), with vision-encoder torch.compile bypass (#30518) and continued v4/v5 compat fixes.",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40724",
                "#40664",
                "#40673"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "Other: Nano-Nemotron-VL static image inputs fix (#40724); Qwen3 MoE no longer calls gate twice (#40664); DeepSeek V2-Lite accuracy drop fix (#40673); Parakeet UX / perf...; New architectures: DeepSeek V4 (#40860), Hunyuan v3 preview (#40681), Granite 4.1 Vision (#40282), EXAONE-4.5 (#39388), BharatGen Param2MoE (#38000), Phi-4-reasoning-vision-15B...; Gemma4 series: fast prefill (#38879), quantized MoE (#39045), Eagle3 (#39450), block-local attention + YaRN for Gemma3 (#39823), bidirectional vision attention for sliding...; LoRA: Qwen3ASRForConditionalGeneration (#37247), Gemma4ForConditionalGeneration (#39291, #38844), DeepSeek V3.2 (#35077), Qwen3.5 / Step3.x expert base_layer extension...; Tool / reasoning parsers: Treat `<tool_call>` as implicit reasoning end in Qwen3 (#35687), `is_reasoning_end_streaming()` override for GptOssReasoningParser (#35745),...",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32662",
                "#35697",
                "#38676"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "CPU: CPU draft-model speculative decoding (#32662), CPU int8 compute mode in AWQ (#35697), head_size 512 in `cpu_attn` (#38676), gelu in `cpu_fused_moe` (#38770), OMP...; Speculative decoding: Eagle3 for MiniMax-M2 (#37512), Eagle3 for Gemma4 (#39450).; Unified Synthetic Acceptance Rate for V1 and V2 (#40662); `SpecDecodeBaseProposer` moved out of `eagle.py` (#40732); DSA + MTP IMA fix (#40772).; Mamba: default to `'align'` cache mode for Mamba-based models when speculative decoding is enabled (#40454).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Petit NVFP4 (#32694), `accept output buffer` in attention (#39125), `cprofile` / `cprofile_context` (#39100), `LLM.reward` offline API (#40688). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32694"
              },
              {
                "change": "Security",
                "impact": "SSRF fix in batch runner `download_bytes_from_url` (#38482).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#38482"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: CPU draft-model speculative decoding (#32662), CPU int8 compute mode in AWQ (#35697), head_size 512 in `cpu_attn` (#38676), gelu in `cpu_fused_moe` (#38770",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32662"
            },
            {
              "label": "Quantization",
              "hardware": "New formats & methods: TurboQuant 2-bit KV cache compression (#38479) with FA3/FA4 prefill (#40092), per-token-head INT8/FP8 KV cache quantization (#38378), fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#38479"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Other: DeepGEMM integrated into the vLLM wheel via CMake (#37980), Lustre FS checkpoint prefetching enabled by default (#39422), Gemma4 fused routing Triton ker",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37980"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: CPU draft-model speculative decoding (#32662), CPU int8 compute mode in AWQ (#35697), head_size 512 in `cpu_attn` (#38676), gelu in `cpu_fused_moe` (#38770",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32662"
            },
            {
              "label": "Quantization",
              "hardware": "New formats & methods: TurboQuant 2-bit KV cache compression (#38479) with FA3/FA4 prefill (#40092), per-token-head INT8/FP8 KV cache quantization (#38378), fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#38479"
            }
          ]
        }
      },
      {
        "version": "v0.19.0",
        "badge": "Release",
        "date": "2026-04-03",
        "stats": "127 upstream changes and 217 PRs",
        "headline": "Gemma 4 support, Zero-bubble async scheduling + speculative decoding",
        "executive_summary": "vLLM v0.19.0 ships 127 upstream changes. Key highlights include: Gemma 4 support: Full Google Gemma 4 architecture support including MoE, multimodal, reasoning, and tool-use capabilities (#38826, #38847). Requires `transforme; Zero-bubble async scheduling + speculative decoding: Async scheduling now supports speculative decoding with zero-bubble overlap, significantly improving throug; Model Runner V2 maturation: MRV2 gains piecewise CUDA graphs for pipeline parallelism (#35162), spec decode rejection sampler with greedy/logprobs support (#372.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#37198",
                "#37609",
                "#37345"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "Compilation: Mega AOT artifact for torch 2.12+ (#37198), lazy graph module to defer recompile (#37609), remove model tag requirement for compile cache (#37345), Triton...; B300/GB300 (SM 10.3): Allreduce fusion enabled by default (#37755), tuned all-reduce communicator (#37756).; Disaggregated serving: PD kv_transfer_params for Anthropic Messages (#37535) and Responses API (#37424), Mooncake heterogeneous TP (#36869), Mamba N-1 prefill for P/D (#37310).; UX: Log once per node by default (#37568), torch profiler with stack enabled (#37571).; flashinfer-cubin added as default CUDA dependency (#37233).",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#37054",
                "#37728",
                "#37024"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Extensible KV Cache, Memory Budgeting & Tiered Offloading.",
              "now": "Bugfixes: Fix gibberish from FP8 MLA KV scale inconsistency (#37054), Mamba state corruption (#37728), deadlock with pause/resume (#37024), FlashInfer MNNVL socket...; CPU: Enable tcmalloc by default (#37607), graceful degradation without tcmalloc/libiomp (#37561), 48.9% throughput improvement for pooling models (#38139), OpenMP thread...; Attention: Distinguish short extends vs decodes (#37303), allow qk_nope_head_dim=192 in FlashInfer MLA (#37475), skip sliding window attention layers with FP8 KV cache...; Non-contiguous KV cache in TRTLLM FP8 dequant kernel (#36867), Qwen3 dual stream input projection (#36795).; FlashInfer sparse MLA as default for FP8 KV cache (#37252).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#36265",
                "#37340",
                "#31201"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Tuned prefill configs for FP8 FA3 (#36265), tuned Triton MoE config for Qwen3.5 on H200 with 9.9% E2E improvement (#37340), H800 MoE configs (#31201).; Removals: Per-tensor-per-channel FP8 removed (#32700), Sparse24 integration and kernels removed (#36799).; GPT-OSS: Router GEMM kernel (#37205), eliminate padding with FlashInfer MXFP4/MXFP8 MoE (#30647), reduce redundant SparseMatrix creation (#37683).; Performance fixes: FP8 DeepGEMM batch invariance (#37718), Triton autotuning for Qwen3.5 (#37338), TRTLLM NVFP4 routing precision (#36725).; TPU: Async scheduling interface (#36924), Qwen3.5 FP8 weight loading fix (#37348).",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38826",
                "#35809",
                "#38120"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "New architectures: Gemma 4 (#38826), Cohere ASR (#35809), Cohere Transcribe (#38120), ColQwen3.5 4.5B (#36887), LFM2-ColBERT-350M (#37528), Granite 4.0 1B Speech (#38019),...; LoRA expansion: H2OVL tower/connector LoRA (#31696), `--lora-target-modules` to restrict LoRA to specific modules (#34984), `language_model_only` respected (#37375), Mistral3...; Features: Temporal compression for Nemotron-3-VL videos (#36808), NemotronH Puzzle + MTP (#37803), torch.compile for InternVL vision encoder (#38049), multiple embedding types...; Features: Limit thinking tokens (hard limit) (#20859), multiple embedding types in single call (#35829), numpy array embeddings for multimodal (#38119),...; Bugfixes: Sleep mode memory leak (#37533), hybrid model stride (#37228), qwen3_next crash (#36795).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Deprecate virtual engine (#37195). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37195"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecate `--disable-frontend-multiprocessing` (#37612). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37612"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Refactor KV cache from list to element (#37487). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37487"
              },
              {
                "change": "Security",
                "impact": "Add `VLLM_MAX_N_SEQUENCES` environment variable to enforce sequence limits (#37952).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37952"
              },
              {
                "change": "Security",
                "impact": "Enforce frame limit in VideoMediaIO to prevent resource exhaustion (#38636).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#38636"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Performance: Optimize top-k in Triton sampler (#37225), optimize token_embed for pooling models with 1% improvement (#37347), fix slow hasattr in CUDAGraphWrapp",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37225"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Persistent MLA kernel from AITER (#36574), FP8xFP8 attention in AITER (#36927).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#36574"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AWQ Marlin support (#36505), wvSplitK skinny GEMM for RDNA4/gfx1x (#34709).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#36505"
            },
            {
              "label": "API & Frontend",
              "hardware": "Responses API: Fix crash with tool_choice=required exceeding max_output_tokens (#37258), fix TTFT recording (#37498), fix Anthropic serving template kwargs (#37",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37258"
            },
            {
              "label": "Engine Core",
              "hardware": "Bugfixes: Fix gibberish from FP8 MLA KV scale inconsistency (#37054), Mamba state corruption (#37728), deadlock with pause/resume (#37024), FlashInfer MNNVL soc",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37054"
            }
          ]
        }
      },
      {
        "version": "v0.18.0",
        "badge": "Release",
        "date": "2026-03-20",
        "stats": "65 upstream changes and 154 PRs",
        "headline": "gRPC Serving Support, GPU-less Render Serving",
        "executive_summary": "vLLM v0.18.0 ships 65 upstream changes. Key highlights include: gRPC Serving Support: vLLM now supports gRPC serving via the new `--grpc` flag (#36169), enabling high-performance RPC-based serving alongside the existing HTTP; GPU-less Render Serving: New `vllm launch render` command (#36166, #34551) enables GPU-less preprocessing and rendering, allowing separation of multimodal prepr; NGram GPU Speculative Decoding: NGram speculative decoding now runs on GPU and is compatible with the async scheduler (#29184), significantly reducing spec deco.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#28053",
                "#36159",
                "#36710"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Performance: Remove busy loop from idle buffer readers (#28053), 2.7% E2E throughput for pooling via worker-side maxsim (#36159), 3.2% via batched maxsim (#36710), CUDA...; Model Runner V2: Probabilistic rejection sampling for spec decode (#35461), pooling models (#36019), extensible CUDA graph dispatch (#35959), WhisperModelState (#35790),...; Intel XPU: Model Runner V2 enabled (#36078), MLA Sparse backend for DeepSeek V3.2 (#33230), LoRA via torch.compile (#36962), block FP8 MoE fallback (#36458),...; torch.compile: FakeTensors instead of real GPU tensors for single-size compilation (#36093), non-contiguous fused RMSNorm + group quant (#36551), stop lazy compiling (#35472).; CustomOp FusedRMSNormGated for torch.compile compatibility (#35877).",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#36557",
                "#35194",
                "#36691"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Stability: VLM concurrent throughput degradation fix (#36557), DP deadlock fix (#35194), DeepSeek V3.2 OOM during CG profiling (#36691), Ray DP startup crash (#36665), NCCL...; New architectures: Sarvam MoE (#33942), OLMo Hybrid (#32550), HyperCLOVAX-SEED-Think-32B VLM (#31471), HyperCLOVAX-SEED-Think-14B (#37107), Kimi-Audio-7B-Instruct (#36127),...; Speculative decoding: Eagle3 for Qwen3.5 (#36658), Eagle3 for Kimi K2.5 MLA (#36361), Eagle for Mistral Large 3 with dense layers (#36163).; NVIDIA: FA4 for MLA prefill (#34732), DeepSeek-V3.2 MLA kernel optimizations (#34917, #35290).; LMCache: Fault tolerance mechanism (#36586), memory leak fix (#35931), race condition fix (#35831), TP size for MLA multi-reader locking (#36129).",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35781",
                "#35158",
                "#36687"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "PD Disaggregation: ~5% scheduler overhead reduction (#35781), KV transfer fix with spec decode (#35158), P/D for hybrid SSM-FA models via NIXL (#36687), PP for multimodal...; Fixes: DeepSeek-V3.2 tokenizer space stripping (#37004), Qwen3.5 tool calling (#36774), Qwen3-VL timestamp mismatch (#36136), Qwen3-Next TP>1 weight sharding (#36242),...; LoRA: Whisper LoRA (#29856), FP8 LoRA dense kernel (#35242).; Performance: Qwen3 Next fused GDN kernel (#35777), LFM2 tuned H100 MoE configs (#36699).; Multimodal: Online use_audio_in_video (#36319), audio extraction from MP4 for Nemotron Nano VL (#35539), audio transcription for MP4/M4A/WebM (#35109), expose...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35316",
                "#36247",
                "#35719"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "ROCm: Quark W4A8 MXFP4/FP8 for LinearLayer (#35316), compressed-tensors fix for DeepSeek-R1 on MI300x (#36247).; AMD ROCm: Sparse MLA CUDA graphs (#35719), MTP lens > 1 in Sparse MLA (#36681), MLA with nhead<16 + FP8 KV for TP=8 (#35850), RoPE+KV cache fusion for AITER FA (#35786),...; Fixes: MLA crash with AWQ/GPTQ quantized models (#34695), score layer quantization for reranker models (#35849), GLM-4.1V non-default quantization (#36321), FP8...; MXFP4 MoE routing simulation override for accuracy (#33595).; FP8 LoRA dense kernel (#35242).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Security",
                "impact": "Respect user `trust_remote_code` setting in NemotronVL and KimiK25 (#36192).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#36192"
              },
              {
                "change": "Security",
                "impact": "Upgrade xgrammar for security fix (#36168).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#36168"
              },
              {
                "change": "Security",
                "impact": "Guard RLHF weight sync deserialization behind insecure serialization flag (#35928).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35928"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Quantization",
              "hardware": "ROCm: Quark W4A8 MXFP4/FP8 for LinearLayer (#35316), compressed-tensors fix for DeepSeek-R1 on MI300x (#36247).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#35316"
            },
            {
              "label": "Engine Core",
              "hardware": "Performance: Remove busy loop from idle buffer readers (#28053), 2.7% E2E throughput for pooling via worker-side maxsim (#36159), 3.2% via batched maxsim (#3671",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28053"
            },
            {
              "label": "Engine Core",
              "hardware": "Stability: VLM concurrent throughput degradation fix (#36557), DP deadlock fix (#35194), DeepSeek V3.2 OOM during CG profiling (#36691), Ray DP startup crash (#",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#36557"
            },
            {
              "label": "Large Scale Serving",
              "hardware": "PD Disaggregation: ~5% scheduler overhead reduction (#35781), KV transfer fix with spec decode (#35158), P/D for hybrid SSM-FA models via NIXL (#36687), PP for ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#35781"
            },
            {
              "label": "Quantization",
              "hardware": "ROCm: Quark W4A8 MXFP4/FP8 for LinearLayer (#35316), compressed-tensors fix for DeepSeek-R1 on MI300x (#36247).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#35316"
            }
          ]
        }
      },
      {
        "version": "v0.17.0",
        "badge": "Release",
        "date": "2026-03-07",
        "stats": "107 upstream changes and 199 PRs",
        "headline": "PyTorch 2.10 Upgrade, FlashAttention 4 Integration",
        "executive_summary": "vLLM v0.17.0 ships 107 upstream changes. Key highlights include: PyTorch 2.10 Upgrade: This release upgrades to PyTorch 2.10.0, which is a breaking change for environment dependencies.; FlashAttention 4 Integration: vLLM now supports the FlashAttention 4 backend (#32974), bringing next-generation attention performance.; Model Runner V2 Maturation: Model Runner V2 has reached a major milestone with Pipeline Parallel (#33960), Decode Context Parallel (#34179), Eagle3 speculative .",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31195",
                "#34448",
                "#31828"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "NVIDIA: SM100 FMHA FP8 prefill for MLA (#31195), SM100 MXFP8 blockscaled grouped MM and quant kernels (#34448), SM100 Oink RMSNorm path (#31828), SM120 FP8 GEMM...; Faster topKperRow decode kernel for DeepSeek-V3.2 sparse attention (#33680).; Fix routing for models without expert groups (MiniMax-M2.1) (#34673).; KV scale loading fix for MLA models (#35430).; FlashInfer Sparse MLA backend (#33451).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#34697",
                "#34580",
                "#34478"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Performance: Qwen3.5 GDN projector fusion (#34697), FlashInfer cuDNN backend for Qwen3 VL ViT (#34580), Step3.5-Flash NVFP4 (#34478), Qwen3MoE tuned configs for H200 (#35457).; AMD ROCm: AITER fused RoPE+KVCache (#33443), MXFP4 MoE weight pre-shuffling on gfx950 (#34192), bitsandbytes quantization (#34688), CK backend for MoE quantization...; AMD: CK backend for MoE (#34301), dynamic MXFP4 for DeepSeek V2 (#34157), bitsandbytes on ROCm (#34688), GPT-OSS Quark format (#29008).; CPU: ARM BF16 cross-compilation (#33079), FP16 for s390x (#34116), KleidiAI INT8_W4A8 for all input dtypes (#34890), s390x vector intrinsics for attention (#34434), prefix...; Qwen3.5: FP8 weight loading fix (#35289), mlp.gate not quantizable (#35156).",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#34110",
                "#34398",
                "#34558"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "New architectures: Qwen3.5 (#34110), COLQwen3 (#34398), ColModernVBERT (#34558), Ring 2.5 (#35102), skt/A.X-K1 (#32407), Ovis 2.6 (#34426),...; Fixes: DeepSeek-VL V2 simplified loading (#35203), Qwen3/Qwen3.5 reasoning parser (#34779), Qwen2.5-Omni/Qwen3-Omni mixed-modality (#35368), Ernie4.5-VL garbled output...; ASR models: FunASR (#33247), FireRedASR2 (#35727), Qwen3-ASR realtime streaming (#34613).; Multimodal: OpenPangu-VL video input (#34134), audio chunking for offline LLM (#34628), Parakeet audio encoder for nemotron-nano-vl (#35100), MiniCPM-o flagos (#34126).; LoRA: LFM2 (#34921), Llama 4 Vision tower/connector (#35147), max vocab size increased to 258048 (#34773), quantized LoRA adapters (#30286).",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33960",
                "#34179",
                "#32771"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Model Runner V2: Pipeline Parallel (#33960), Decode Context Parallel (#34179), piecewise & mixed CUDA graphs (#32771), Eagle3 with CUDA graphs (#35029, #35040), pooling...; Intel XPU: CUDA graph support (#34482), GPUDirect RDMA via NIXL (#35270), TORCH_SDPA/TRITON_ATTN as ViT backend (#35010), vllm-xpu-kernels v0.1.3 (#35984).; Eagle3 on Model Runner V2 with CUDA graphs (#35029, #35040), Eagle3 + disaggregated serving (#34529).; Decode Context Parallel in Model Runner V2 (#34179).; DP+EP for spec decoding in Model Runner V2 (#35294).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed per-request logits processors (#34400). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#34400"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed unused MM placeholders in request output (#34944). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#34944"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed Swin model (#35821). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35821"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Scheduled v0.17 deprecations applied (#35441). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35441"
              },
              {
                "change": "Security",
                "impact": "Fix SSRF bypass via backslash-@ URL parsing inconsistency (#34743).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#34743"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: ARM BF16 cross-compilation (#33079), FP16 for s390x (#34116), KleidiAI INT8_W4A8 for all input dtypes (#34890), s390x vector intrinsics for attention (#344",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33079"
            },
            {
              "label": "MoE Refactor",
              "hardware": "Fused MoE + LoRA shared expert dual stream, 1.07x throughput (#34933).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#34933"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: SM100 FMHA FP8 prefill for MLA (#31195), SM100 MXFP8 blockscaled grouped MM and quant kernels (#34448), SM100 Oink RMSNorm path (#31828), SM120 FP8 GEMM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31195"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: ARM BF16 cross-compilation (#33079), FP16 for s390x (#34116), KleidiAI INT8_W4A8 for all input dtypes (#34890), s390x vector intrinsics for attention (#344",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33079"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: Pipeline Parallel async send/recv 2.9% E2E throughput (#33368), pooling maxsim 13.9% throughput improvement (#35330), Triton ViT attention backend ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33368"
            }
          ]
        }
      },
      {
        "version": "v0.16.0",
        "badge": "Release",
        "date": "2026-02-25",
        "stats": "42 upstream changes and 152 PRs",
        "headline": "Async scheduling + Pipeline Parallelism, Realtime API",
        "executive_summary": "vLLM v0.16.0 ships 42 upstream changes. Key highlights include: Async scheduling + Pipeline Parallelism is now fully supported, delivering 30.8% E2E throughput improvement and 31.8% TPOT improvement (#32618).; Realtime API: A new WebSocket-based Realtime API enables streaming audio interactions (#33187), building on the Voxtral realtime infrastructure.; RLHF workflow improvements: Native NCCL-based weight syncing API (#31943), layerwise weight reloading for QeRL (#32133), and engine pause/resume with request pr.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33193",
                "#33371",
                "#33221"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "UX: Nested configs in YAML files (#33193), GGUF `repo_id:quant_type` syntax (#33371), DeepSeek ReasoningParser with thinking enabled by default (#33221), remove noisy CT...; Performance: GLM-4.7-GPTQ decode and MTP acceptance rate regression fix (#33771), DeepSeek V3.2 fast detokenization (#33855), DeepSeek V3.2 tokenizer fix (#33832), GLM-5 MTP...; NVIDIA: FlashInfer TRTLLM BF16 MoE integration (#32954), SM100 INT4 W4A16 kernel (#32437), SM121 (DGX Spark) CUTLASS support (#33517), MNNVL protocol for GB series...; ARM CPU: KleidiAI INT4 dynamic quant with BF16 activations (#33122), NEON BFMMLA BF16 paged attention (#32263), vectorization backend optimization (#30329), attention...",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33379",
                "#33659",
                "#33679"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Intel XPU: Platform overhaul - deprecated IPEX, switched to vllm-xpu-kernels (#33379). New: unquantized MoE (#33659), MXFP4 MoE (#33679), WNA16 kernel (#33973), scaled_mm...; Removed BitBlas quantization (#32683) and Marlin 24 (#32688).; Performance: Chat completion streaming optimization (#33782), ORJSONResponse for faster API responses (#33548), MoE permute optimization for CUTLASS FP8 (#32892),...; New: FP8 block quant for CompressedTensorsW8A16Fp8 (#33280), ModelOpt MXFP8 for dense models (#33786), NVFP4/FP8 on Turing GPUs (#33076), TP > 4 for FP4 Gemm (#31099).; Bugfixes: FP8 online quantization memory fix (#31914), asymmetric W4A16 (ConchLinear) for CT (#33200), DeepSeek V3.2 NVFP4 (#33932), LoRA FP8 (#33879), quantized Falcon-H1...",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33005",
                "#33312",
                "#33165"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "New architectures: GLM-OCR with MTP (#33005), Qwen3-ASR (#33312), DeepSeek-OCR-2 (#33165), Intern-S1-Pro (#33636), MiniCPM-o 4.5 (#33431), openPangu7B-VL (#32449),...; LoRA expansion: Gemma3 vision components (#32764), Nemotron-H MTP models (#32265), Qwen3 output embedding (#29816). Optimized fused MoE-LoRA kernel indexing (#32770, #32774),...; Features: Qwen3-Omni transcription (#29828), Mistral Large 3 with FlashInfer MoE (#33174), LFM2 SigLIP2 intermediate encoder layers (#33370), Qwen3-Omni/GLM-4.xV MRoPE...; Performance: Grammar bitmask H2D copy on separate stream (#33059), zero-copy GQA for multimodal and CPU (#33732), early-reject oversized MM requests (#33502), CPU memory leak...; Features: run_batch transcription/translation support (#33934), /server_info collect_env (#33246), OTEL tracing during model loading (#31162), clear MM and encoder cache...",
              "config_snippet": ""
            },
            {
              "title": "Deprecation & Breaking Changes Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33402",
                "#33477",
                "#33535"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Deprecation & Breaking Changes Enhancements.",
              "now": "Removed deprecated `reasoning_content` message field (#33402).; Removed deprecated pooling items (#33477).; Removed deprecated `VLLM_ALL2ALL_BACKEND` environment variable (#33535).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Deprecation & Breaking Changes Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed BitBlas quantization (#32683) and Marlin 24 (#32688). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32683"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated `reasoning_content` message field (#33402). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33402"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated pooling items (#33477). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33477"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated `VLLM_ALL2ALL_BACKEND` environment variable (#33535). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33535"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated IPEX for XPU, switched to vllm-xpu-kernels (#33379). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33379"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "IBM Z: BF16 kernel type for s390x (#33788).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33788"
            },
            {
              "label": "Engine Core",
              "hardware": "Async scheduling + Pipeline Parallelism: Full support with 30.8% throughput improvement (#32618), optimized spec decode + async scheduling with 1.5% throughput ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32618"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "IBM Z: BF16 kernel type for s390x (#33788).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33788"
            }
          ]
        }
      },
      {
        "version": "v0.15.0",
        "badge": "Release",
        "date": "2026-01-29",
        "stats": "50 upstream changes and 77 PRs",
        "headline": "Bug Fixes",
        "executive_summary": "vLLM v0.15.0 ships 50 upstream changes. Key highlights include: * Speculative decoding: Eagle draft_model_config fix (#31753). * DeepSeek: DeepSeek-V3.1 + DeepGEMM incompatible scale shapes fix (#32361). * Distributed: DP+Mo.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32661",
                "#28506",
                "#32438"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "Metrics: Removed deprecated `vllm:time_per_output_token_seconds` metric - use `vllm:inter_token_latency_seconds` instead (#32661).; TPU: Pipeline parallelism support (#28506), backend option (#32438).; MoRI EP: High-performance all2all backend for Expert Parallel (#28664).; Consumer GPU support: Flash Attention Triton backend on RDNA3/RDNA4 (#32944).; Intel XPU: AgRsAll2AllManager for distributed communication (#32654).",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32058",
                "#30885",
                "#32805"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "MoE performance: 1.2-2% E2E throughput improvement via grouped topk kernel fusion (#32058), NVFP4 small-batch decoding improvement (#30885), faster cold start for MoEs with...; Model Runner V2: VLM support (#32546), architecture improvements.; torch.compile: SiluAndMul and QuantFP8 CustomOp compilation (#32806), Triton prefill attention performance (#32403).; AOT compilation: torch.compile inductor artifacts support (#25205).; Whisper: torch.compile support (#30385).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32679",
                "#32697",
                "#32681"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Quantization: DeepSpeedFp8 removed (#32679), RTN removed (#32697), HQQ deprecated (#32681).; MXFP4: W4A16 support for compressed-tensors MoE models (#32285).; Non-gated MoE: Quantization support with Marlin, NVFP4 CUTLASS, FP8, INT8, and compressed-tensors (#32257).; FP8 KV cache: Per-tensor and per-attention-head quantization via llmcompressor (#30141).; FP4 kernel optimization: Up to 65% faster FP4 quantization on Blackwell (SM100F) using 256-bit loads, ~4% E2E throughput improvement (#32520).",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33131",
                "#30997",
                "#32329"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "New architectures: Kimi-K2.5 (#33131), Molmo2 (#30997), Step3vl 10B (#32329), Step1 (#32511), GLM-Lite (#31386), Eagle2.5-8B VLM (#32456).; Blackwell defaults: FlashInfer MLA is now the default MLA backend on Blackwell, with TRTLLM as default prefill (#32615).; FP4 support: MLA projection GEMMs with dynamic quantization (#32238).; DeepSeek: DeepSeek-V3.1 + DeepGEMM incompatible scale shapes fix (#32361).; DeepGEMM newer version",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Metrics: Removed deprecated `vllm:time_per_output_token_seconds` metric - use `vllm:inter_token_latency_seconds` instead (#32661). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32661"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Environment variables: Removed deprecated environment variables (#32812). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32812"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Quantization: DeepSpeedFp8 removed (#32679), RTN removed (#32697), HQQ deprecated (#32681). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32679"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Mamba prefix caching: Block-aligned prefix caching for Mamba/hybrid models with `--enable-prefix-caching --mamba-cache-mode align`. Achieves ~2x speedup by cach",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30877"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "FP4 kernel optimization: Up to 65% faster FP4 quantization on Blackwell (SM100F) using 256-bit loads, ~4% E2E throughput improvement (#32520).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32520"
            },
            {
              "label": "Breaking Changes & Deprecations",
              "hardware": "Metrics: Removed deprecated `vllm:time_per_output_token_seconds` metric - use `vllm:inter_token_latency_seconds` instead (#32661).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32661"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "MoE performance: 1.2-2% E2E throughput improvement via grouped topk kernel fusion (#32058), NVFP4 small-batch decoding improvement (#30885), faster cold start f",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32058"
            },
            {
              "label": "Engine Core",
              "hardware": "Mamba prefix caching: Block-aligned prefix caching for Mamba/hybrid models with `--enable-prefix-caching --mamba-cache-mode align`. Achieves ~2x speedup by cach",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30877"
            }
          ]
        }
      },
      {
        "version": "v0.14.0",
        "badge": "Release",
        "date": "2026-01-20",
        "stats": "120 upstream changes and 143 PRs",
        "headline": "Async scheduling is now enabled by default, Excludes some not-yet-supported configurations: pipeline parallel, CPU backend,",
        "executive_summary": "vLLM v0.14.0 ships 120 upstream changes. Key highlights include: Async scheduling is now enabled by default - Users who experience issues can disable with `--no-async-scheduling`.; Excludes some not-yet-supported configurations: pipeline parallel, CPU backend, non-MTP/Eagle spec decoding.; PyTorch 2.9.1 is now required and the default wheel is compiled against cu129..",
        "five_parts": {
          "big_deal": [
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31569",
                "#31719",
                "#31539"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "DeepSeek-OCR (#31569), Qwen3-Next (#31719), NemotronH (#31539), PLaMo 2/3; Qwen3-VL as reranker; GDN attention decode speedup (Qwen3-Next); Qwen3Moe B200 Triton configs; Multimodal tower/connector LoRA (#26674): LLaVA (#31513), BLIP2 (#31620), PaliGemma (#31656), Pixtral (#31724), DotsOCR (#31825), GLM4-V",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31688",
                "#31285",
                "#30944"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Deprecated quantization schemes removed; XPU: FP8 streaming quant (#30944), custom workers; Fused SiLU+Mul+Quant for NVFP4; NVFP4 stride fusion; Qwen3-Next FP8 CUTLASS configs",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#26575",
                "#28624",
                "#29304"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "ROCm: AITER RMSNorm fusion (#26575), MTP for AITER MLA (#28624), moriio connector (#29304), xgrammar upstream; Async scheduling default with spec decode (#27614, #31998) and structured outputs; TPU: tpu-inference path (#30808), Sophgo docs",
              "config_snippet": ""
            },
            {
              "title": "Hardware & Performance Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31754",
                "#31830",
                "#31167"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Hardware & Performance Enhancements.",
              "now": "2.9% throughput + 10.8% TTFT via fill(0) optimization; 5.3% throughput + 2.2% TTFT via problem size calculation; GDN Attention blocking copy removal; SM103 support; Sliding window attention optimization",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Hardware & Performance Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated quantization schemes removed (#31688, #31285) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#31688"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`seed_everything` deprecated (#31659) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#31659"
              },
              {
                "change": "Security",
                "impact": "Prevent token leaks in crash logs (#30751)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#30751"
              },
              {
                "change": "Security",
                "impact": "`weights_only=True` in torch.load (#32045)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32045"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "2.9% throughput + 10.8% TTFT via fill(0) optimization (#31754)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31754"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "5.3% throughput + 2.2% TTFT via problem size calculation (#31830)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31830"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "2.9% throughput + 10.8% TTFT via fill(0) optimization (#31754)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31754"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "5.3% throughput + 2.2% TTFT via problem size calculation (#31830)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31830"
            },
            {
              "label": "Bug Fixes (User-Facing)",
              "hardware": "CPU RoPE gibberish with `--enforce-eager` (#31643)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31643"
            }
          ]
        }
      },
      {
        "version": "v0.13.0",
        "badge": "Release",
        "date": "2025-12-19",
        "stats": "48 upstream changes and 95 PRs",
        "headline": "Model Runner V2, Low-Precision Quantization Kernels",
        "executive_summary": "Translating vLLM v0.13.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29558",
                "#30171",
                "#30187"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "DeepEP High-Throughput CUDA graph enabled by default: 5.3% throughput, 4.4% TTFT improvement; Model Runner V2: Min-p sampling (#30171), NaN detection in logits (#30187).; Attention: PrefixLM support for FlexAttention (#27938) and TritonAttention (#30386), CUDA graphs for 3D Triton attention (#28306), `TRITON_MLA` without prefix-caching (#29125).",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#25552",
                "#25693",
                "#26668"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "AMD ROCm: Aiter quantization kernels (#25552), torch.compile layernorm/silu + FP8 quant (#25693), Triton ScaledMM fallback (#26668), MXFP4 w4a4 inference (#29775).; New: W4A8 grouped GEMM on Hopper (#29691), online FP8 with streaming post-processing (#29196), FP8 weight reloading for RLHF (#28480).; GGUF: MoE + GGUF restored for Qwen3 MoE (#30116), Qwen2 MoE (#30307), HF defaults override (#30118).; EPLB: NVFP4 support (#29804), algorithm abstraction (#26471).; Quantization: BitsAndBytes for Qwen3-Omni-MoE (#29896).",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#30037",
                "#29752",
                "#30490"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Model enhancements: Qwen3-VL embeddings support (#30037), Qwen3-VL EVS (Efficient Video Sampling) (#29752), DeepSeek V3.2 proper `drop_thinking` logic (#30490), DeepSeek...; Tool parsers: DeepSeek-V3.2 (#29848), Gigachat 3 (#29905), Holo2 reasoning (#30048).; MLA FP8 optimization with ReduceScatterSum (#29795), direct k_nope/k_pe copy; Sparse prefill kernel for FP8 KV-cache in DeepSeek-V3.2; DeepGEMM fused layout kernel: 4.3% throughput, 10.7% TTFT improvement",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29421",
                "#30072",
                "#30062"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "Whisper: Major performance improvements - [V1 is now faster than V0](https://github.com/vllm-project/vllm/issues/24946#issuecomment-3680725754) (~3x speedup vs v0.12.0)....; New models: BAGEL (AR only) (#28439), AudioFlamingo3 (#30539), JAIS 2 (#30188), latent MoE architecture support (#30203).; Performance: Fused blockwise quant RMS norm (#27883), MoE LoRA loading reduction (#30243), encoder cache optimization (#30475), CPU KV offloading streams (#29013).; CPU: Whisper support (#30062), Arm Optimized Routines vectorized exp (#30068), x86 CPU wheel pipeline (#28848).; Batch invariance: FA2 and LoRA batch-invariant support (#30018).",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Security",
                "impact": "Additional protection for CVE-2025-62164 (#30649).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#30649"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Whisper: Major performance improvements - [V1 is now faster than V0](https://github.com/vllm-project/vllm/issues/24946#issuecomment-3680725754) (~3x speedup vs ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29421"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepEP High-Throughput CUDA graph enabled by default: 5.3% throughput, 4.4% TTFT improvement (#29558)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29558"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepGEMM fused layout kernel: 4.3% throughput, 10.7% TTFT improvement (#29546)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29546"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepGEMM experts initialization: 3.9% TTFT improvement (#30494)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30494"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "`group_topk` kernel: 1.9% throughput, 2.1% TPOT improvement (#30159)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30159"
            }
          ]
        }
      },
      {
        "version": "v0.12.0",
        "badge": "Release",
        "date": "2025-12-03",
        "stats": "83 upstream changes and 77 PRs",
        "headline": "EAGLE Speculative Decoding Improvements, Significant Performance Optimizations",
        "executive_summary": "vLLM v0.12.0 ships 83 upstream changes. Key highlights include: EAGLE Speculative Decoding Improvements: Multi-step CUDA graph support (#29559), DP>1 support (#26086), and multimodal support with Qwen3VL (#29594).; Significant Performance Optimizations: 18.1% throughput improvement from batch invariant BMM (#29345), 2.2% throughput improvement from shared experts overlap (; AMD ROCm Expansion: DeepSeek v3.2 + SparseMLA support (#26670), FP8 MLA decode (#28032), AITER attention backend (#28701)..",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29345",
                "#26670",
                "#28032"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Batch invariant BMM optimization: 18.1% throughput improvement, 10.7% TTFT improvement on DeepSeek-V3.1; DeepSeek v3.2 and SparseMLA support; FP8 MLA decode support; Shared Experts Overlap with FlashInfer DeepGEMM: 2.2% throughput improvement, 3.6% TTFT improvement at batch size 32; DeepGEMM N dim restriction reduced from 128 to 64 multiplier",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#28834",
                "#29068",
                "#29327"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "New model families: PLaMo-3 (#28834), OpenCUA-7B (#29068), HunyuanOCR (#29327), Mistral Large 3 and Ministral 3 (#29757).; Multimodal enhancements: Qwen3 Omni audio-in-video support (#27721), Eagle3 multimodal support for Qwen3VL (#29594).; LoRA extra vocab; Configuration: Flexible `inputs_embeds_size` separate from `hidden_size` (#29741), `--fully-sharded-loras` for fused_moe (#28761).; Format support: Gemma3 GGUF multimodal support (#27772).",
              "config_snippet": ""
            },
            {
              "title": "V0 Deprecation & Breaking Changes Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29330",
                "#29000",
                "#29090"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in V0 Deprecation & Breaking Changes Enhancements.",
              "now": "Deprecated metrics; `num_lookahead_slots`; `best_of`; `xformers` backend; `seed=None`",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29242",
                "#28892",
                "#27141"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "NVFP4 MoE CUTLASS support for SM120; TRTLLM MoE NVFP4 kernel; CuteDSL MoE with NVFP4 DeepEP dispatch; LoRA: FusedMoE LoRA Triton kernel for MXFP4 (#29708).; NVFP4:",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "V0 Deprecation & Breaking Changes Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "`num_lookahead_slots` (#29000) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29000"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`best_of` (#29090) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29090"
              },
              {
                "change": "Before You Upgrade",
                "impact": "LoRA extra vocab (#28545) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#28545"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`xformers` backend (#29262) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29262"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`seed=None` (#29185) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29185"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "Batch invariant BMM optimization: 18.1% throughput improvement, 10.7% TTFT improvement on DeepSeek-V3.1 (#29345)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29345"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Shared Experts Overlap with FlashInfer DeepGEMM: 2.2% throughput improvement, 3.6% TTFT improvement at batch size 32 (#28879)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28879"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Batch invariant BMM optimization: 18.1% throughput improvement, 10.7% TTFT improvement on DeepSeek-V3.1 (#29345)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29345"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Shared Experts Overlap with FlashInfer DeepGEMM: 2.2% throughput improvement, 3.6% TTFT improvement at batch size 32 (#28879)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28879"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepEP low-latency with round-robin expert placement (#28449)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28449"
            }
          ]
        }
      },
      {
        "version": "v0.11.0",
        "badge": "Release",
        "date": "2025-10-02",
        "stats": "585 upstream changes and 549 PRs",
        "headline": "This release completes the removal of V0 engine. V0 engine code including AsyncL, This releases turns on **FULL_AND_PIECEWISE as the CUDA gr",
        "executive_summary": "vLLM v0.11.0 ships 585 upstream changes. Key highlights include: This release completes the removal of V0 engine. V0 engine code including AsyncLLMEngine, LLMEngine, MQLLMEngine, all attention backends, and related components; This releases turns on FULL_AND_PIECEWISE as the CUDA graph mode default. This should provide better out of the box performance for most models, particularly fi; * Engines: AsyncLLMEngine (#25025), LLMEngine (#25033), MQLLMEngine (#25019), core (#25321), model runner (#25328), MP executor (#25329). * Components: Attentio.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#24733",
                "#24849",
                "#24741"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Performance: GLM-4.1V 916ms TTFT reduction via fused RMSNorm (#24733), GLM-4 MoE SharedFusedMoE optimization (#24849), Qwen2.5-VL CUDA sync removal (#24741), Qwen3-VL Triton...; FP8: Per-token-group quantization (#24342), hardware-accelerated instructions (#24757), torch.compile KV cache (#22758), paged attention update (#22222).; FP4: NVFP4 for dense models (#25609), Gemma3 (#22771), Llama 3.1 405B (#25135).; Compressed tensors: Blocked FP8 for MoE (#25219).; Fp8 paged attention update by @xiao-llm",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#24462",
                "#24783",
                "#25896"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "DeepGEMM: Enabled by default (#24462), 5.5% throughput improvement (#24783).; New architectures: DeepSeek-V3.2-Exp (#25896), Qwen3-VL series (#24727), Qwen3-Next (#24526), OLMo3 (#24534), LongCat-Flash (#23991), Dots OCR (#24645), Ling2.0 (#24627), CWM...; MoE: Shared expert overlap optimization (#24254), SiLU kernel for DeepSeek-R1 (#24054), Enable Allgather/ReduceScatter backend for NaiveAllToAll (#23964).; NVIDIA: FP8 FlashInfer MLA decode (#24705), BF16 fused MoE for Hopper/Blackwell expert parallel (#25503).; [Attention][FlashInfer] Enable FP8 FlashInfer (TRTLLM) MLA decode by @MatthewBonanni",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#24532",
                "#25070",
                "#22188"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "Distributed: NCCL symmetric memory with 3-4% throughput improvement (#24532), enabled by default for TP (#25070).; Disaggregated serving: KV transfer metrics (#22188), NIXL MLA latent dimension (#25902).; Removes source compilation of nixl dependency by @bbartels; [CI] Add Decode Context Parallelism (DCP) test to CI by @minosfuture; [P/D][Nixl] Introduce `KVTransferMetrics` and aggregation strategy by @NickLucche",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#25178",
                "#25703",
                "#25275"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "AMD: ROCm 7.0 (#25178), GLM-4.5 MI300X tuning (#25703).; [ROCm][Bugfix] Only enable +rms_norm based on aiter if not explicitly disabled by @gshtras; Components: Attention backends (#25351), encoder-decoder (#24907), output processor (#25320), sampling metadata (#25345), Sequence/Sampler (#25332).; PyTorch 2.8 for CPU (#25652), FlashInfer 0.3.1 (#24470), CUDA 13 (#24599), ROCm 7.0 (#25178).; [DOCs] Update ROCm installation docs section by @gshtras",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Engines: AsyncLLMEngine (#25025), LLMEngine (#25033), MQLLMEngine (#25019), core (#25321), model runner (#25328), MP executor (#25329). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#25025"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Components: Attention backends (#25351), encoder-decoder (#24907), output processor (#25320), sampling metadata (#25345), Sequence/Sampler (#25332). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#25351"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Interfaces: LoRA (#25686), async output processor (#25334), MultiModalPlaceholderMap (#25366), seq group methods (#25330), placeholder attention (#25510), input embeddings (#25242), multimodal registry (#25362), max_seq_",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#25686"
              },
              {
                "change": "Security",
                "impact": "https://github.com/vllm-project/vllm/security/advisories/GHSA-wr9h-g72x-mwhm",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v0.11.0"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "Performance: GLM-4.1V 916ms TTFT reduction via fused RMSNorm (#24733), GLM-4 MoE SharedFusedMoE optimization (#24849), Qwen2.5-VL CUDA sync removal (#24741), Qw",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#24733"
            },
            {
              "label": "Engine Core",
              "hardware": "Performance: FlashInfer RoPE 2x speedup (#21126), fused Q/K RoPE 11% improvement (#24511, #25005), 8x spec decode overhead reduction (#24986), FlashInfer spec d",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#21126"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD: ROCm 7.0 (#25178), GLM-4.5 MI300X tuning (#25703).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#25178"
            },
            {
              "label": "API & Frontend",
              "hardware": "Metrics: V1 TPOT histogram (#24015), hidden deprecated gpu_ metrics (#24245), KV cache GiB units (#25204, #25479).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#24015"
            },
            {
              "label": "Security",
              "hardware": "https://github.com/vllm-project/vllm/security/advisories/GHSA-wr9h-g72x-mwhm",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "v0.11.0"
            }
          ]
        }
      },
      {
        "version": "v0.10.0",
        "badge": "Release",
        "date": "2025-07-24",
        "stats": "899 upstream changes and 881 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels",
        "executive_summary": "Translating vLLM v0.10.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#20534",
                "#20211",
                "#20971"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Enhanced compatibility: BERT/RoBERTa with AutoWeightsLoader (#20534), HF format support for MiniMax (#20211), Gemini configuration (#20971), GLM-4 updates (#20736).; NVIDIA Blackwell/SM100 optimizations: CUTLASS block scaled group GEMM for smaller batches (#20640), FP8 groupGEMM support (#20447), DeepGEMM integration (#20087), FlashInfer...; Performance improvements: 48% request duration reduction via microbatch tokenization for concurrent requests (#19334), fused MLA QKV + strided layernorm (#21116), Triton...; [Model] Fix minimax model cache & lm_head precision by @qscqesze; [BUGFIX][DEEPSEEK][MODEL_LOAD] fix w13, w2 weight not initialized assert by @xuechendi",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17888",
                "#20893",
                "#21100"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "New quantization support: MXFP4 for MoE models (#17888), BNB support for Mixtral and additional MoE models (#20893, #21100), in-flight quantization for MoE (#20061).; Hardware-specific: FP8 KV cache quantization on TPU (#19292), FP8 support for BatchedTritonExperts (#18864), optimized INT8 vectorization kernels (#20331).; Performance optimizations: Triton backend for DeepGEMM per-token group quantization (#20841), CUDA kernel for per-token group quantization (#21083), CustomOp abstraction for...; [NVIDIA] Add SM100 Flashinfer MoE blockscale fp8 backend for low latency by @kaixih; Hardware expansion: ARM CPU int8 quantization (#14129), PPC64LE/ARM V1 support (#20554), Intel XPU ray distributed execution (#20659), shared-memory pipeline parallel for CPU...",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#20591",
                "#21060",
                "#20702"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "New families: Llama 4 with EAGLE support (#20591), EXAONE 4.0 (#21060), Microsoft Phi-4-mini-flash-reasoning (#20702), Hunyuan V1 Dense + A13B with reasoning/tool parsing...; [Bugfix] Fix EAGLE vocab embedding for multimodal target model by @zixi-qi; [Bugfix][1/n] Fix the speculative decoding test by setting the target dtype by @houseroad; [Bugfix][2/n] Fix speculative decoding CI - Fix test_ngram_e2e_greedy_correctness by @houseroad; [V1][Speculative Decoding] Fix DeepSeek MTP by @cjackal",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#19891",
                "#20741",
                "#19440"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "[Fix][ROCm] Remove unused variables to fix build error on GFX11/12 by @hyoon1; [ROCm][Regression] Remove tensor creation that harms performance on ROCm by @gshtras; [ROCm][V1] Adding ROCm to the list of plaforms using V1 by default by @gshtras; [ROCm] Add rules to automatically label ROCm related PRs by @houseroad; [Misc] Fix  misleading ROCm warning by @jeejeelee",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Fix][ROCm] Remove unused variables to fix build error on GFX11/12 by @hyoon1 (#19891)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#19891"
              },
              {
                "change": "What's Changed",
                "impact": "[ROCm][Regression] Remove tensor creation that harms performance on ROCm by @gshtras (#20741)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#20741"
              },
              {
                "change": "What's Changed",
                "impact": "Remove unnecessary explicit title anchors and use relative links instead by @hmellor (#20620)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#20620"
              },
              {
                "change": "API & Frontend",
                "impact": "OpenAI compatibility: Responses API implementation (#20504, #20975), image object support in llm.chat (#19635), tool calling with required choice and $defs (#20629).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#20504"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "Add fused MOE config for Qwen3 30B A3B on B200 by @0xjunhao (#19455)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#19455"
            },
            {
              "label": "What's Changed",
              "hardware": "[Doc] Fix quantization link titles by @DarkLight1337 (#19478)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#19478"
            },
            {
              "label": "What's Changed",
              "hardware": "[Doc] Rename page titles by @DarkLight1337 (#20130)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#20130"
            },
            {
              "label": "What's Changed",
              "hardware": "Remove unnecessary explicit title anchors and use relative links instead by @hmellor (#20620)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#20620"
            },
            {
              "label": "What's Changed",
              "hardware": "Stop using title frontmatter and fix doc that can only be reached by search by @hmellor (#20623)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#20623"
            }
          ]
        }
      },
      {
        "version": "v0.9.0",
        "badge": "Release",
        "date": "2025-05-15",
        "stats": "697 upstream changes and 654 PRs",
        "headline": "vLLM has upgraded to PyTorch 2.7! This is a breaking change for enviro, The default wheel has been upgraded from CUDA 12.4 to CUDA 12.8. We ",
        "executive_summary": "vLLM v0.9.0 ships 697 upstream changes. Key highlights include: vLLM has upgraded to PyTorch 2.7!  (#16859) This is a breaking change for environment dependency.; The default wheel has been upgraded from CUDA 12.4 to CUDA 12.8. We will distribute CUDA 12.6 wheel on GitHub artifact.; As a general rule of thumb, our CUDA version policy follow PyTorch's CUDA version policy..",
        "five_parts": {
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#16577",
                "#14702",
                "#17466"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "Structured Outputs: Thinking compatibility (#16577), Spec Decoding (#14702), Qwen3 reasoning parser (#17466), `tool_choice: required` for Xgrammar (#17845), Structural Tag with...; AMD: Enable FP8 KV cache on V1 (#17870), Tuned fused moe config for Qwen3 MoE on MI300X (#17535, #17530), AITER biased group topk (#17955), Block-Scaled GEMM (#14968), MLA...; [FEAT] [ROCm]: Add Qwen/Qwen3-30B-A3B-FP8 fused moe config for MI300X by @tjtanaa; [Bugfix][ROCm] Restrict ray version due to a breaking release by @gshtras; [ROCm] remove unsupported archs from rocm triton flash-attention supported list by @hongxiayang",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#16362",
                "#16943",
                "#17850"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Quantization: `nvidia/DeepSeek-R1-FP4` (#16362), Quark MXFP4 format (#16943), AutoRound (#17850), torchao models with `AOPerModuleConfig` (#17826), CUDA Graph support for V1...; NVIDIA: cutlass support for blackwell fp8 blockwise gemm; [FEAT] [ROCm]: Add Qwen/Qwen3-235B-A22B-FP8 TP4 triton fused moe config by @tjtanaa; Update nm to rht in doc links + refine fp8 doc by @mgoin; [ROCm][FP8][Kernel] FP8 quantization fused into Custom Paged Attention by @gshtras",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17326",
                "#17211",
                "#17504"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "Spec Decode: EAGLE share input embedding (#17326), torch.compile & cudagraph to EAGLE (#17211), EAGLE3 (#17504), log accumulated metrics(#17913), Medusa; [V1][Spec Decode] Apply torch.compile & cudagraph to EAGLE by @luyuzhe111; [V1][Spec Decode] Apply torch.compile & cudagraph to EAGLE3 by @zixi-qi; [Fix] Support CUDAGraph capture for encoder-decoder on ROCm by @ProExpertProg; [AMD][torch.compile] Enable silu+fp8_quant fusion for rocm by @charlifu",
              "config_snippet": ""
            },
            {
              "title": "Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17426",
                "#17452",
                "#17525"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Features Enhancements.",
              "now": "CLI: `deprecated=True`; Reasoning: deprecate `--enable-reasoning`; Frontend: progress bar for adding requests (#17525), `chat_template_kwargs` in `LLM.chat` (#17356), `/classify` endpoint (#17032), truncation control for embedding models...; Metrics: kv event publishing (#16750), API for accessing in-memory Prometheus metrics",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Security",
                "impact": "Migrate to REGEX Library to prevent catastrophic backtracking (#18454, #18750)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#18454"
              },
              {
                "change": "Security",
                "impact": "Prevent side-channel attacks via cache salting (#17045)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#17045"
              },
              {
                "change": "Security",
                "impact": "Fix image hash collision in certain edge cases (#17378)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#17378"
              },
              {
                "change": "Security",
                "impact": "Add `VLLM_ALLOW_INSECURE_SERIALIZATION` env var (#17490)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#17490"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardwares",
              "hardware": "AMD: Enable FP8 KV cache on V1 (#17870), Tuned fused moe config for Qwen3 MoE on MI300X (#17535, #17530), AITER biased group topk (#17955), Block-Scaled GEMM (#",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17870"
            },
            {
              "label": "What's Changed",
              "hardware": "Remove Falcon3 2x7B from CI by @hmellor (#17404)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17404"
            },
            {
              "label": "What's Changed",
              "hardware": "[FEAT] [ROCm]: Add Qwen/Qwen3-30B-A3B-FP8 fused moe config for MI300X by @tjtanaa (#17530)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17530"
            },
            {
              "label": "What's Changed",
              "hardware": "Initialize the delta tool call fields explicitly by @maxdebayser (#17340)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17340"
            },
            {
              "label": "What's Changed",
              "hardware": "[Model] GritLM supports other attention backends by @DarkLight1337 (#18109)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#18109"
            }
          ]
        }
      },
      {
        "version": "v0.8.0",
        "badge": "Release",
        "date": "2025-03-18",
        "stats": "636 upstream changes and 518 PRs",
        "headline": "V1, DeepSeek Improvements",
        "executive_summary": "vLLM v0.8.0 ships 636 upstream changes. Key highlights include: We have now enabled V1 engine by default (#13726) for supported use cases. Please refer to [V1 user guide](https://docs.vllm.ai/en/latest/getting_started/v1_use; We observe state of the art performance with vLLM running DeepSeek model on latest version of vLLM: * MLA Enhancements: * FlashMLA integration (#13747, #13867, ; * Support nvfp4 cutlass gemm (#13571) * Add cutlass support for blackwell fp8 gemm (#13798) * Update the flash attn tag to support Blackwell (#14244) * Add Mode.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#14274",
                "#12622",
                "#12520"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity.; vLLM will now default `generation_config` from model for chat template, sampling parameters such as temperature, etc.; Add ModelOpt FP4 Checkpoint Support; [Kernel] Add ModelOpt FP4 Checkpoint Support by @pavanimajety; Support chunked prefill for LMCache connector",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#13167",
                "#14316",
                "#13802"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "Deepseek GGUF support; Chunked prefill/paged attention in MLA on ROCm; [Bugfix] Fix deepseek-v2 error: \"missing 1 required positional argument: 'residual'\" by @LucasWilkinson; EP Support for DeepSeek Models; MTP: Expand DeepSeek MTP code to support k > n_predict",
              "config_snippet": ""
            },
            {
              "title": "Hardware Support Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12613",
                "#14198",
                "#13658"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Hardware Support Enhancements.",
              "now": "Adding cpu inference with VXE ISA for s390x architecture; Add documentation for s390x cpu implementation; Remove cuda hard code in models and layers; Faster Custom Paged Attention kernels; Perf improvement for DSv3 on AMD GPUs",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#14152",
                "#13650",
                "#13970"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "Improved performance for V1 Triton (ROCm) backend; [ROCM] fix native attention function call by @gongdao123; [ROCm] Fix the Kernels, Core, and Prefix Caching AMD CI groups by @SageMoore; [Doc] Fix ROCm documentation by @b8zhong; [ROCm][V1][Bugfix] Add get_builder_cls method to the ROCmAttentionBackend class by @SageMoore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Hardware Support Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity. (#14274) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#14274"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The `kv_cache` and `attn_metadata` arguments for model's forward method has been removed; as the attention backend has access to these value via `forward_context`. (#13887) -> Action: Check deprecation/removal impact bef",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#13887"
              },
              {
                "change": "Before You Upgrade",
                "impact": "vLLM will now default `generation_config` from model for chat template, sampling parameters such as temperature, etc. (#12622) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#12622"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Several request time metrics (`vllm:time_in_queue_requests`, `vllm:model_forward_time_milliseconds`, `vllm:model_execute_time_milliseconds`) has been deprecated and subject to removal (#14135) -> Action: Check deprecatio",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#14135"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Breaking Changes",
              "hardware": "The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity. (#14274)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#14274"
            },
            {
              "label": "Hardware Support",
              "hardware": "Adding cpu inference with VXE ISA for s390x architecture (#12613)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12613"
            },
            {
              "label": "Hardware Support",
              "hardware": "Add documentation for s390x cpu implementation (#14198)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#14198"
            },
            {
              "label": "What's Changed",
              "hardware": "[Misc]: Add support for goodput on guided benchmarking + TPOT calculation refactor by @b8zhong (#13736)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#13736"
            },
            {
              "label": "What's Changed",
              "hardware": "[Bugfix] Explicitly include \"omp.h\" for MacOS to avoid installation failure by @realShengYao (#14051)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#14051"
            }
          ]
        }
      },
      {
        "version": "v0.7.0",
        "badge": "Release",
        "date": "2025-01-27",
        "stats": "419 upstream changes and 402 PRs",
        "headline": "vLLM's V1 engine is ready for testing! This is a rewritten engine designed for p, New methods (`LLM.sleep`, `LLM.wake_up`, `LLM.collective_r",
        "executive_summary": "vLLM v0.7.0 ships 419 upstream changes. Key highlights include: vLLM's V1 engine is ready for testing! This is a rewritten engine designed for performance and architectural simplicity. You can turn it on by setting environme; New methods (`LLM.sleep`, `LLM.wake_up`, `LLM.collective_rpc`, `LLM.reset_prefix_cache`) in vLLM for the post training frameworks! (#12361, #12084, #12284).; `torch.compile` is now fully integrated in vLLM, and enabled by default in V1. You can turn it on via `-O3` engine parameter. (#11614, #12243, #12043, #12191, #.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12134",
                "#12408",
                "#12049"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "AMD: MI300 FP8 format for block_quant (#12134), Tuned MoE configurations for multiple models (#12408, #12049), block size heuristic for avg 2.8x speedup for int8 models; [CI/Build][CPU] Fix CPU CI by lazy importing triton FP8 kernels by @bigPYJ1151; [Core] Default to using per_token quantization for fp8 when cutlass is supported. by @elfiegg; [Bugfix] Remove comments re: pytorch for outlines + compressed-tensors dependencies by @tdoublep; [Misc]Add BNB quantization for MolmoForCausalLM  by @jeejeelee",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#11742",
                "#11578",
                "#12068"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Frontier MoE & Sparse-MLA Speedups.",
              "now": "New generative models: CogAgent (#11742), Deepseek-VL2 (#11578, #12068, #12169), fairseq2 Llama (#11442), InternLM3 (#12037), Whisper; [Bugfix] Remove hardcoded `head_size=256` for Deepseek v2 and v3 by @Isotr0py; [Model] Port deepseek-vl2 processor and remove `deepseek_vl2` dependency by @Isotr0py; [Docs] Document Deepseek V3 support by @simon-mo; [Misc] Clean up debug code in Deepseek-V3 by @Isotr0py",
              "config_snippet": ""
            },
            {
              "title": "Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#11620",
                "#11900",
                "#11682"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Features Enhancements.",
              "now": "VLM: Merged multi-modal processor is now ready for model developers!; Progress in out-of-tree hardware support; New `collective_rpc` abstraction; Apple: Native support for macOS Apple Silicon; Support torchrun and SPMD-style offline inference",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12222",
                "#12238",
                "#11906"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Extensible KV Cache, Memory Budgeting & Tiered Offloading.",
              "now": "For Deepseek V3: optimize `moe_align_block_size` for cuda graph and large num_experts; [Kernel] optimize moe_align_block_size for cuda graph and large num_experts (e.g. DeepSeek-V3) by @jinzhen-lin; [Docs] Update FP8 KV Cache documentation by @mgoin; [FP8][Kernel] Dynamic kv cache scaling factors computation by @gshtras; [V1] Remove `_get_cache_block_size` by @heheda12345",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Bugfix] Remove hardcoded `head_size=256` for Deepseek v2 and v3 by @Isotr0py (#12067)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#12067"
              },
              {
                "change": "What's Changed",
                "impact": "[Model] Port deepseek-vl2 processor and remove `deepseek_vl2` dependency by @Isotr0py (#12169)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#12169"
              },
              {
                "change": "What's Changed",
                "impact": "[Model] Remove hardcoded image tokens ids from Pixtral by @ywang96 (#11582)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#11582"
              },
              {
                "change": "What's Changed",
                "impact": "Remove print statement in DeepseekScalingRotaryEmbedding by @mgoin (#11604)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#11604"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Features",
              "hardware": "AMD: MI300 FP8 format for block_quant (#12134), Tuned MoE configurations for multiple models (#12408, #12049), block size heuristic for avg 2.8x speedup for int",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12134"
            },
            {
              "label": "What's Changed",
              "hardware": "Update bnb.md with example for OpenAI by @bet0x (#11718)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#11718"
            },
            {
              "label": "What's Changed",
              "hardware": "[Kernel][Triton][AMD] Use block size heuristic for avg 2.8x speedup for int8 models by @rasmith (#11698)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#11698"
            },
            {
              "label": "What's Changed",
              "hardware": "[CI] Pass local python version explicitly to pre-commit mypy.sh by @heheda12345 (#12224)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12224"
            },
            {
              "label": "What's Changed",
              "hardware": "[Benchmark] More accurate TPOT calc in `benchmark_serving.py` by @njhill (#12288)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12288"
            }
          ]
        }
      },
      {
        "version": "v0.6.0",
        "badge": "Release",
        "date": "2024-09-04",
        "stats": "135 upstream changes and 117 PRs",
        "headline": "Performance Update, Misc",
        "executive_summary": "vLLM v0.6.0 ships 135 upstream changes. Key highlights include: * We are excited to announce a faster vLLM delivering 2x more throughput compared to v0.5.3. The default parameters should achieve great speed up, but we recomm; * Support benchmarking async engine in benchmark_throughput.py (#7964) * Progress in integration with `torch.compile`: avoid Dynamo guard evaluation overhead (#.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7049",
                "#7911",
                "#7921"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "Asynchronous output processor overlaps the output data structures construction with GPU works, delivering 12% throughput increase.; TPU: single and multi-host TPUs on GKE (#7613), Async output processing; [CI/Build][ROCm] Enabling tensorizer tests for ROCm by @alexeykondrat; [hardware][rocm] allow rocm to override default env var by @youkaichao; [CI/Build][ROCm] Enabling LoRA tests on ROCm by @alexeykondrat",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7798",
                "#7985",
                "#7244"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Extensible KV Cache, Memory Budgeting & Tiered Offloading.",
              "now": "Using FlashInfer backend for FP8 KV Cache (#7798, #7985), rejection sampling in Speculative Decoding; [Bugfix] Address #8009 and add model test for flashinfer fp8 kv cache. by @pavanimajety; [Core][Kernels] Use FlashInfer backend for FP8 KV Cache when available. by @pavanimajety; Revert \"[Core][Kernels] Use FlashInfer backend for FP8 KV Cache when available.\" by @youkaichao; [Core][Kernels] Enable FP8 KV Cache with Flashinfer backend.  + BugFix for kv_cache_dtype=auto by @pavanimajety",
              "config_snippet": ""
            },
            {
              "title": "Production Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7753",
                "#8120",
                "#5649"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Production Features Enhancements.",
              "now": "Enable chunked prefill and prefix caching together; OpenAI-Compatible Tools API + Streaming for Hermes & Mistral models!; Add json_schema support from OpenAI protocol",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7894",
                "#7975",
                "#7898"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Model Runner V2.",
              "now": "NVIDIA GPU: extend cuda graph size for H200; extend cuda graph size for H200 by @kushanam; [torch.compile] remove reset by @youkaichao; Progress in integration with `torch.compile`: avoid Dynamo guard evaluation overhead (#7898), skip compile for profiling; [core][torch.compile] not compile for profiling by @youkaichao",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            },
            {
              "persona": "Production Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "Remove faulty Meta-Llama-3-8B-Instruct-FP8.yaml lm-eval test by @mgoin (#7961)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7961"
              },
              {
                "change": "What's Changed",
                "impact": "[Misc] Remove snapshot_download usage in InternVL2 test by @Isotr0py (#7835)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7835"
              },
              {
                "change": "What's Changed",
                "impact": "[Misc] Update compressed tensors lifecycle to remove `prefix` from `create_weights` by @dsikka (#7825)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7825"
              },
              {
                "change": "What's Changed",
                "impact": "[torch.compile] remove reset by @youkaichao (#7975)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7975"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Performance Update",
              "hardware": "We are excited to announce a faster vLLM delivering 2x more throughput compared to v0.5.3. The default parameters should achieve great speed up, but we recommen",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7528"
            },
            {
              "label": "What's Changed",
              "hardware": "[CI/Build] fix: Add the +empty tag to the version only when the VLLM_TARGET_DEVICE envvar was explicitly set to \"empty\" by @tomeras91 (#8118)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#8118"
            },
            {
              "label": "Performance Update",
              "hardware": "Asynchronous output processor overlaps the output data structures construction with GPU works, delivering 12% throughput increase. (#7049, #7911, #7921, #8050)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7049"
            },
            {
              "label": "Performance Update",
              "hardware": "We are excited to announce a faster vLLM delivering 2x more throughput compared to v0.5.3. The default parameters should achieve great speed up, but we recommen",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7528"
            },
            {
              "label": "What's Changed",
              "hardware": "[Bugfix] Fix #7592 vllm 0.5.4 enable_chunked_prefill throughput is slightly lower than 0.5.3~0.5.0. by @noooop (#7874)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7592"
            }
          ]
        }
      },
      {
        "version": "v0.5.0",
        "badge": "Release",
        "date": "2024-06-11",
        "stats": "122 upstream changes and 109 PRs",
        "headline": "Low-Precision Quantization Kernels, Next-Gen Speculative Decoding",
        "executive_summary": "Translating vLLM v0.5.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5352",
                "#5388",
                "#5159"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "[FP8 support](https://docs.vllm.ai/en/stable/quantization/fp8.html) is ready for testing. By quantizing the portion model weights to 8 bit precision float point, the inference...; [Kernel] Retune Mixtral 8x22b configs for FP8 on H100 by @pcmoritz; Support bitsandbytes quantization and QLoRA; [Misc][Breaking] Change FP8 checkpoint format from act_scale -> input_scale by @mgoin; [Kernel] Update Cutlass fp8 configs by @varun-sundar-rabindranath",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5400",
                "#5157",
                "#5137"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "[Speculative Decoding](https://docs.vllm.ai/en/stable/models/spec_decode.html) and [Automatic Prefix Caching](https://docs.vllm.ai/en/stable/automatic_prefix_caching/apc.html)...; [Speculative Decoding] Add `ProposerWorkerBase` abstract class by @njhill; [Speculative decoding] Initial spec decode docs by @cadedaniel",
              "config_snippet": ""
            },
            {
              "title": "Production Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5237",
                "#5383",
                "#4199"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Production Features Enhancements.",
              "now": "Add OpenAI [Vision API](https://docs.vllm.ai/en/stable/models/vlm.html) support. Currently only LLaVA and LLaVA-NeXT are supported. We are working on adding more models in the...",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5230",
                "#5137",
                "#5278"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "Default to multiprocessing backend for single-node distributed case; [Kernel] Refactor CUTLASS kernels to always take scales that reside on the GPU by @tlrmchlsmth; [Frontend] OpenAI API server: Add `add_special_tokens` to ChatCompletionRequest (default False) by @tomeras91; [BugFix] Fix log message about default max model length by @njhill; [Core][Doc] Default to multiprocessing for single-node distributed case by @njhill",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Production Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            },
            {
              "term": "P/D Disaggregation (Prefill/Decode Split & NIXL)",
              "plain_english": "Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL.",
              "bottom_line": "Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs."
            },
            {
              "term": "DCP & PCP (Decode / Prefill Context Parallelism)",
              "plain_english": "Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP).",
              "bottom_line": "Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K\u20131M token agentic prompts."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Misc][Breaking] Change FP8 checkpoint format from act_scale -> input_scale by @mgoin (#5353)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#5353"
              },
              {
                "change": "What's Changed",
                "impact": "[Bugfix] Remove deprecated @abstractproperty by @zhuohan123 (#5174)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#5174"
              },
              {
                "change": "What's Changed",
                "impact": "[Core] Remove unnecessary copies in flash attn backend by @Yard1 (#5138)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#5138"
              },
              {
                "change": "What's Changed",
                "impact": "Remove Ray health check by @Yard1 (#4693)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#4693"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Production Features",
              "hardware": "[FP8 support](https://docs.vllm.ai/en/stable/quantization/fp8.html) is ready for testing. By quantizing the portion model weights to 8 bit precision float point",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5352"
            },
            {
              "label": "What's Changed",
              "hardware": "[misc] benchmark_serving.py -- add ITL results and tweak TPOT results by @tlrmchlsmth (#5263)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5263"
            },
            {
              "label": "What's Changed",
              "hardware": "[Kernel] Retune Mixtral 8x22b configs for FP8 on H100 by @pcmoritz (#5294)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5294"
            },
            {
              "label": "Production Features",
              "hardware": "[FP8 support](https://docs.vllm.ai/en/stable/quantization/fp8.html) is ready for testing. By quantizing the portion model weights to 8 bit precision float point",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5352"
            },
            {
              "label": "Production Features",
              "hardware": "[Speculative Decoding](https://docs.vllm.ai/en/stable/models/spec_decode.html) and [Automatic Prefix Caching](https://docs.vllm.ai/en/stable/automatic_prefix_ca",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5400"
            }
          ]
        }
      },
      {
        "version": "v0.4.0",
        "badge": "Release",
        "date": "2024-03-30",
        "stats": "202 upstream changes and 193 PRs",
        "headline": "Next-Gen Speculative Decoding, Production features Enhancements",
        "executive_summary": "Translating vLLM v0.4.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3236",
                "#3538",
                "#3103"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "Progress in chunked prefill scheduler (#3236, #3538), and speculative decoding (#3103).; [Speculative decoding 3/9] Worker which speculates, scores, and applies rejection sampling by @cadedaniel",
              "config_snippet": ""
            },
            {
              "title": "Production features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2762",
                "#3703"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Production features Enhancements.",
              "now": "Automatic prefix caching (#2762, #3703) supporting long system prompt to be automatically cached across requests. Use the flag `--enable-prefix-caching` to turn it on.; Support `json_object` in OpenAI server for arbitrary JSON, `--use-delay` flag to improve time to first token across many requests, and `min_tokens` to EOS suppression.; Custom all reduce kernel has been re-enabled after more robustness fixes.; Replaced cupy dependency due to its bugs.",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3433",
                "#3346",
                "#3660"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "New models: Command+R(#3433), Qwen2 MoE(#3346), DBRX(#3660), XVerse (#3610), Jais (#3183).; Possible fix for conflict between Automated Prefix Caching (#2762) and multi-LoRA support (#1804) by @jacobthebanana; Add GPTQ support for Gemma by @TechxGenus; Feature add lora support for Qwen2 by @whyiug; Enhance lora tests with more layer and rank variations by @tterrysun",
              "config_snippet": ""
            },
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3175",
                "#3256",
                "#3279"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in What's Changed Enhancements.",
              "now": "enable --gpu-memory-utilization in benchmark_throughput.py by @AllenDou; [Minor Fix] Use cupy-cuda11x in CUDA 11.8 build by @chenxu2048; Dynamic scheduler delay to improve ITL performance  by @tdoublep; [Misc] add the \"download-dir\" option to the latency/throughput benchmarks by @AmadeusChan; [Minor Fix] Remove unused code in benchmark_prefix_caching.py by @gty111",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Production features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "What's Changed Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            },
            {
              "term": "MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)",
              "plain_english": "Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs.",
              "bottom_line": "Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Production features",
                "impact": "Replaced cupy dependency due to its bugs.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v0.4.0"
              },
              {
                "change": "What's Changed",
                "impact": "[Minor Fix] Remove unused code in benchmark_prefix_caching.py by @gty111 (#3171)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#3171"
              },
              {
                "change": "What's Changed",
                "impact": "Removed Extraneous Print Message From OAI Server by @robertgshaw2-neuralmagic (#3440)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#3440"
              },
              {
                "change": "What's Changed",
                "impact": "Replace `lstrip()` with `removeprefix()` to fix Ruff linter warning by @ronensc (#2958)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2958"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "[Minor Fix] Use cupy-cuda11x in CUDA 11.8 build by @chenxu2048 (#3256)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3256"
            },
            {
              "label": "What's Changed",
              "hardware": "Dynamic scheduler delay to improve ITL performance  by @tdoublep (#3279)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3279"
            },
            {
              "label": "What's Changed",
              "hardware": "enable --gpu-memory-utilization in benchmark_throughput.py by @AllenDou (#3175)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3175"
            },
            {
              "label": "What's Changed",
              "hardware": "[Minor Fix] Use cupy-cuda11x in CUDA 11.8 build by @chenxu2048 (#3256)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3256"
            },
            {
              "label": "What's Changed",
              "hardware": "[Misc] add the \"download-dir\" option to the latency/throughput benchmarks by @AmadeusChan (#3621)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3621"
            }
          ]
        }
      },
      {
        "version": "v0.3.0",
        "badge": "Release",
        "date": "2024-01-31",
        "stats": "80 upstream changes and 81 PRs",
        "headline": "Experimental multi-lora support, Experimental prefix caching support",
        "executive_summary": "vLLM v0.3.0 ships 80 upstream changes. Key highlights include: Experimental multi-lora support; Experimental prefix caching support; FP8 KV Cache support.",
        "five_parts": {
          "big_deal": [
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2598",
                "#2566",
                "#2384"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in What's Changed Enhancements.",
              "now": "Support for Stable LM 2 by @dakotamahan-stability; AWQ: Up to 2.66x higher throughput by @casper-hansen; [Minor] Remove unused code in attention by @WoosukKwon; Update a more user-friendly error message, offering more considerate advice for beginners, when using V100 GPU #1901 by @chuanzhubin; Miner fix of type hint by @beginlner",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2274",
                "#2581",
                "#2545"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Multi-Vendor Accelerator Scaling.",
              "now": "[ROCm] add support to ROCm 6.0 and MI300 by @hongxiayang; ROCm: Allow setting compilation target by @rlrs; Fix \"Port could not be cast to integer value as <function get_open_port>\" by @pcmoritz; Added `include_stop_str_in_output` and `length_penalty` parameters to OpenAI API by @galatolofederico; Don't build punica kernels by default by @pcmoritz",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2336",
                "#2424"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Next-Gen Speculative Decoding.",
              "now": "[Speculative decoding 1/9] Optimized rejection sampler by @cadedaniel; [Speculative decoding 2/9] Multi-step worker for draft model by @cadedaniel",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2279"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Extensible KV Cache, Memory Budgeting & Tiered Offloading.",
              "now": "Support FP8-E5M2 KV Cache by @zhaoyang-star",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "What's Changed Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Minor] Remove unused code in attention by @WoosukKwon (#2384)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2384"
              },
              {
                "change": "What's Changed",
                "impact": "migrate pydantic from v1 to v2 by @joennlae (#2531)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2531"
              },
              {
                "change": "What's Changed",
                "impact": "Update Ray version requirements by @simon-mo (#2636)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2636"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "AWQ: Up to 2.66x higher throughput by @casper-hansen (#2566)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2566"
            },
            {
              "label": "What's Changed",
              "hardware": "Support for Stable LM 2 by @dakotamahan-stability (#2598)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2598"
            },
            {
              "label": "What's Changed",
              "hardware": "AWQ: Up to 2.66x higher throughput by @casper-hansen (#2566)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2566"
            },
            {
              "label": "What's Changed",
              "hardware": "Add StableLM3B model by @ita9naiwa (#2372)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2372"
            },
            {
              "label": "What's Changed",
              "hardware": "fix stablelm.py tensor-parallel-size bug by @YingchaoX (#2482)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2482"
            }
          ]
        }
      },
      {
        "version": "v0.2.0",
        "badge": "Release",
        "date": "2023-09-28",
        "stats": "54 upstream changes and 54 PRs",
        "headline": "Up to 60% performance improvement by optimizing de-tokenization and sampler, Initial support for AWQ (performance not optimized)",
        "executive_summary": "vLLM v0.2.0 ships 54 upstream changes. Key highlights include: Up to 60% performance improvement by optimizing de-tokenization and sampler; Initial support for AWQ (performance not optimized); Support for RoPE scaling and LongChat.",
        "five_parts": {
          "big_deal": [
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1059",
                "#1102",
                "#1222"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in What's Changed Enhancements.",
              "now": "Remove AsyncLLMEngine busy loop, shield background task by @Yard1; clean api code, remove redundant background task. by @esmeetu; [Fix] Remove false assertion by @WoosukKwon; add option to shorten prompt print in log by @leiwen83; Make `max_model_len` configurable by @Yard1",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1067",
                "#1224"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Disaggregated Serving.",
              "now": "[FIX] Don't initialize parameter by default by @zhuohan123; Provide default max model length by @WoosukKwon",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1173",
                "#1210"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend.",
              "now": "fix qwen-14b model by @Sanster; qwen add rope_scaling by @Sanster",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1032"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Low-Precision Quantization Kernels.",
              "now": "Implement AWQ quantization support for LLaMA by @WoosukKwon",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "What's Changed Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            },
            {
              "term": "P/D Disaggregation (Prefill/Decode Split & NIXL)",
              "plain_english": "Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL.",
              "bottom_line": "Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs."
            },
            {
              "term": "DCP & PCP (Decode / Prefill Context Parallelism)",
              "plain_english": "Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP).",
              "bottom_line": "Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K\u20131M token agentic prompts."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "Remove AsyncLLMEngine busy loop, shield background task by @Yard1 (#1059)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1059"
              },
              {
                "change": "What's Changed",
                "impact": "clean api code, remove redundant background task. by @esmeetu (#1102)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1102"
              },
              {
                "change": "What's Changed",
                "impact": "[Fix] Remove false assertion by @WoosukKwon (#1222)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1222"
              },
              {
                "change": "What's Changed",
                "impact": "Add pandas to requirements.txt by @WoosukKwon (#1047)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1047"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "Remove AsyncLLMEngine busy loop, shield background task by @Yard1 (#1059)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#1059"
            },
            {
              "label": "What's Changed",
              "hardware": "clean api code, remove redundant background task. by @esmeetu (#1102)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#1102"
            },
            {
              "label": "What's Changed",
              "hardware": "[Fix] Remove false assertion by @WoosukKwon (#1222)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#1222"
            },
            {
              "label": "What's Changed",
              "hardware": "add option to shorten prompt print in log by @leiwen83 (#991)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#991"
            },
            {
              "label": "What's Changed",
              "hardware": "Make `max_model_len` configurable by @Yard1 (#972)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#972"
            }
          ]
        }
      },
      {
        "version": "v0.1.0",
        "badge": "Inaugural Release",
        "date": "2023-06-20",
        "stats": "initial open-source release with PagedAttention and continuous batching",
        "headline": "Initial Open-Source Release with PagedAttention, Continuous Batching, and OpenAI-Compatible Serving",
        "executive_summary": "vLLM 0.1.0 is the initial open-source release of vLLM from UC Berkeley Sky Computing Lab. It introduces PagedAttention\u2014managing attention Keys and Values in non-contiguous virtual memory blocks like an operating system\u2014reducing KV cache memory waste from 60\u201380% to under 4% and delivering up to 24\u00d7 higher LLM serving throughput than Hugging Face Transformers.",
        "five_parts": {
          "big_deal": [
            {
              "title": "PagedAttention: OS-Style Virtual Memory Paging for the KV Cache",
              "status": "Core Architecture",
              "status_tone": "green",
              "prs": [
                "#1"
              ],
              "before": "Existing LLM serving systems pre-allocated contiguous GPU memory slabs sized to the maximum possible sequence length (e.g., 2048 tokens) for every request, wasting 60\u201380% of GPU HBM on internal and external fragmentation.",
              "now": "PagedAttention partitions the KV cache into fixed-size token blocks allocated on demand via a block table, eliminating external fragmentation and allowing near-100% GPU memory utilization for concurrent requests.",
              "config_snippet": "python -m vllm.entrypoints.openai.api_server --model decapoda-research/llama-7b-hf"
            },
            {
              "title": "Continuous Iteration-Level Batching & Copy-on-Write Beam Search",
              "status": "Default / GA",
              "status_tone": "green",
              "prs": [
                "#2"
              ],
              "before": "Static batching forced fast, short responses to wait idle on the GPU until the longest sequence in the batch finished generating.",
              "now": "The vLLM scheduler operates at the single-token iteration level\u2014immediately evicting finished requests and slotting in new prompts on the very next forward pass, while sharing common prompt prefixes across parallel samples via block-level copy-on-write.",
              "config_snippet": "from vllm import LLM, SamplingParams\nllm = LLM(model=\"lmsys/vicuna-13b-v1.3\", tensor_parallel_size=2)"
            },
            {
              "title": "Drop-In OpenAI-Compatible API Server (`/v1/completions` & `/v1/chat/completions`)",
              "status": "New Capability",
              "status_tone": "cyan",
              "prs": [
                "#3",
                "#4"
              ],
              "before": "Self-hosting open-weights models like LLaMA or Falcon required rewriting application client code away from the OpenAI SDK.",
              "now": "Ships a built-in FastAPI/AsyncLLMEngine HTTP server compatible with the OpenAI Python client, supporting streaming SSE responses and multi-GPU Ray/NCCL Tensor Parallelism.",
              "config_snippet": "curl http://localhost:8000/v1/completions \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"model\": \"decapoda-research/llama-7b-hf\", \"prompt\": \"San Francisco is a\", \"max_tokens\": 32}'"
            }
          ],
          "who_benefits": [
            {
              "persona": "Self-Hosted LLM API Operators",
              "models": "LLaMA-7B/13B/30B/65B, OPT, GPT-NeoX, StarCoder, Vicuna",
              "gpus": "NVIDIA A100, A10G, V100, and L4 GPUs",
              "impact": "Up to 24\u00d7 higher throughput than naive Hugging Face `model.generate()` and 2.2\u00d7\u20133.5\u00d7 higher than static-memory TGI."
            },
            {
              "persona": "Parallel Sampling & Beam Search Workloads",
              "models": "Code generation (StarCoder) & multi-candidate chat",
              "gpus": "Single-node and Ray multi-GPU clusters",
              "impact": "Up to 55% KV memory savings from block-level copy-on-write prefix sharing."
            }
          ],
          "jargon_decoded": [
            {
              "term": "PagedAttention",
              "plain_english": "Storing a model's per-token Key-Value (KV) attention state in small, non-contiguous memory pages mapped by a lookup table\u2014just like virtual memory in Linux.",
              "bottom_line": "Frees up wasted GPU VRAM so you can batch 5\u00d7\u201310\u00d7 more users on the same GPU."
            },
            {
              "term": "Continuous Batching",
              "plain_english": "Adding new user requests to a running GPU batch at every single token step instead of waiting for all current requests to finish.",
              "bottom_line": "Eliminates GPU idle bubbles and cuts queueing latency under real traffic."
            }
          ],
          "upgrade_guide": {
            "verdict": "Inaugural Release \u2014 Install via `pip install vllm` on CUDA 11.8+.",
            "rows": [
              {
                "change": "Initial release requirements",
                "impact": "Requires Python 3.8\u20133.11, PyTorch 2.0+, and an NVIDIA GPU with compute capability 7.0+ (V100, T4, A10G, A100, H100).",
                "action": "Run `pip install vllm` and launch `vllm.entrypoints.openai.api_server`.",
                "pr": "#1"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "LLaMA-13B Online Serving Throughput vs. HF Transformers",
              "hardware": "NVIDIA A100-40GB (ShareGPT workload)",
              "metric": "Up to 24\u00d7 higher req/s",
              "pct_bar": 98,
              "pr": "#1"
            },
            {
              "label": "LLaMA-13B Throughput vs. HuggingFace TGI",
              "hardware": "NVIDIA A100-40GB (ShareGPT workload)",
              "metric": "2.2\u00d7\u20133.5\u00d7 higher req/s",
              "pct_bar": 85,
              "pr": "#2"
            },
            {
              "label": "KV Cache Memory Waste Reduction",
              "hardware": "PagedAttention Block Manager",
              "metric": "60\u201380% waste \u2192 <4% waste",
              "pct_bar": 95,
              "pr": "#1"
            }
          ]
        }
      }
    ],
    "weekly_editions": [
      {
        "id": "this-week-in-vllm",
        "date_iso": "2026-11-19",
        "date_range": "Thursday, 2026-11-19 (Weekly Digest)",
        "reading_time": "4 min read",
        "headline": "This Week in vLLM (2026-11-19): Hopper Humming MoE Kernels, Specialized Drafters for Kimi-K3.1, and Faster Multimodal Encoder Scheduling",
        "intro": "Keep up with vLLM development in 5 minutes a week. This week merged 100+ pull requests across the core scheduler, speculative decoding, and ROCm/Hopper hardware kernels\u2014without requiring a version bump.",
        "tldr_cards": [
          {
            "tag": "Performance",
            "title": "Faster Hopper MoE Kernels for Inkling 2 & Block-FP8 to MXFP4 Requantization",
            "summary": "New Humming expert GEMM kernels landed for Hopper GPUs alongside lower-memory online requantization from block-FP8 to MXFP4\u2014cutting peak VRAM spikes during model load.",
            "impact": "Lower startup memory overhead on H100/H200 and higher token throughput on quantized MoE models.",
            "prs": [
              "#68761",
              "#68171"
            ]
          },
          {
            "tag": "Speculative Decoding",
            "title": "Kimi-K3.1 & NemotronH Multi-Token Prediction (MTP) Upgrades",
            "summary": "Grouped-Query Attention (GQA) DSpark draft models now run on vLLM's specialized drafter path for Kimi-K3.1, and multimodal embeddings now pass cleanly into NemotronH MTP.",
            "impact": "Unlocks 1.4x\u20131.8x faster interactive token streaming on Kimi-K3.1 and multimodal Nemotron deployments.",
            "prs": [
              "#68701",
              "#68153",
              "#68213"
            ]
          },
          {
            "tag": "Memory & Stability",
            "title": "Immediate Encoder Memory Reclamation & CPU Offload Leak Fixes",
            "summary": "The scheduler now frees consumed multimodal encoder inputs at schedule time rather than waiting for request completion, and releases CPU offload caches cleanly on shutdown.",
            "impact": "Prevents GPU/CPU memory bloat on vision-language (VLM) servers handling bursty image and video prompts.",
            "prs": [
              "#68799",
              "#68710",
              "#68729"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges (Plain-English Breakdown)",
            "items": [
              {
                "title": "Free consumed multimodal encoder inputs at schedule time",
                "pr": "#68799",
                "pr_url": "https://github.com/vllm-project/vllm/pull/68799",
                "what_it_is": "Previously, temporary vision/audio encoder tensors stayed in memory longer than necessary during chunked prefill. The scheduler now frees those buffers as soon as the encoder pass finishes.",
                "why_you_care": "If you serve multimodal models (Qwen-VL, Pixtral, Gemma-3/4), you get more headroom for KV cache and fewer out-of-memory errors under heavy image concurrency."
              },
              {
                "title": "Serve GQA DSpark drafts on the specialized drafter for Kimi-K3.1",
                "pr": "#68701",
                "pr_url": "https://github.com/vllm-project/vllm/pull/68701",
                "what_it_is": "Connects Kimi-K3.1's Grouped-Query Attention (GQA) DSpark speculative draft model directly to vLLM's fast specialized drafter execution loop.",
                "why_you_care": "Cuts CPU launch overhead during speculative decoding, making single-user coding agents and reasoning loops noticeably snappier on Hopper and Blackwell."
              },
              {
                "title": "Don't pin the grammar bitmask during structured JSON output",
                "pr": "#68764",
                "pr_url": "https://github.com/vllm-project/vllm/pull/68764",
                "what_it_is": "Stops allocating page-locked (pinned) host memory for every structured-output grammar bitmask.",
                "why_you_care": "Eliminates host pinned-memory exhaustion when thousands of concurrent tool-calling or JSON-schema requests hit your server."
              }
            ]
          },
          {
            "category": "Other Notable Merges Across the Engine",
            "bullets": [
              "Inkling 2 gains Humming expert GEMM kernels on NVIDIA Hopper GPUs (#68761)",
              "ROCm fixes a cross-wave race condition in batched kpool decode updates on AMD Instinct GPUs (#68749)",
              "HiSparse attention now skips redundant GPU restores when a KV cache import is cancelled (#68729)",
              "Transformers modeling backend now fuses sliced packed-QKV projections automatically (#68698)",
              "SimpleCPUOffload cleanly releases host DRAM caches when the KV connector shuts down (#68710)",
              "Multimodal Hugging Face processors now accept raw NumPy image arrays directly without conversion overhead (#68655)"
            ]
          }
        ],
        "label": "2026-11-19 (Latest)"
      },
      {
        "id": "2026-11-12",
        "date_iso": "2026-11-12",
        "label": "2026-11-12",
        "date_range": "Thursday, 2026-11-12",
        "reading_time": "4 min read",
        "headline": "This Week in vLLM (2026-11-12): Extensible KV Cache Enabled by Default, Model Runner V1 Removed, and Mistral Large 4 (1T)",
        "intro": "Highlights from the 2026-11-12 development week leading into v0.34.0: Extensible KV Cache flips on by default, legacy Model Runner V1 is removed, and day-0 support lands for Mistral Large 4 and Inkling 2 Small.",
        "tldr_cards": [
          {
            "tag": "Memory & Throughput",
            "title": "Extensible KV Cache Flips On by Default (#56492)",
            "summary": "vLLM now sizes the KV cache from memory actually free after CUDA graph capture and warmup rather than relying on a static 0.90 estimate.",
            "impact": "Expands KV token capacity by 25\u201355% on H100/H200/Blackwell without manual gpu_memory_utilization tuning.",
            "prs": [
              "#56492",
              "#67296"
            ]
          },
          {
            "tag": "Engine Core",
            "title": "Model Runner V1 Removed; MRV2 Is Now the Sole GPU Runner (#63373)",
            "summary": "Completes the migration to Model Runner V2 with dual-batch overlap, Decode Context Parallelism (DCP), and GPU suffix decoding.",
            "impact": "Remove VLLM_USE_V2_MODEL_RUNNER=0 from launch scripts before upgrading.",
            "prs": [
              "#63373",
              "#61464"
            ]
          },
          {
            "tag": "New Models",
            "title": "Day-0 Support for Mistral Large 4 (1T) & Inkling 2 Small (#64534)",
            "summary": "Full sparse-MLA, DSA indexer, and FP8/NVFP4 support for Mistral Large 4 across NVIDIA Blackwell/Hopper and AMD MI350.",
            "impact": "Serve 1-trillion-parameter MoE checkpoints out of the box on multi-GPU nodes.",
            "prs": [
              "#64534",
              "#64111"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges",
            "items": [
              {
                "title": "Default --block-size changed from 16 to 64 on CUDA",
                "pr": "#63231",
                "what_it_is": "Increases the default paged-attention KV cache block size from 16 tokens to 64 tokens on CUDA backends.",
                "why_you_care": "Improves attention kernel utilization on Hopper and Blackwell; pass --block-size 16 only if a custom KV connector requires 16-token blocks."
              },
              {
                "title": "Token-sharded sparse-MLA prefill under Tensor Parallelism",
                "pr": "#63956",
                "what_it_is": "Shards sparse Multi-head Latent Attention prefill tokens across TP ranks by default.",
                "why_you_care": "Speeds up GLM-5.3 Time-to-First-Token (TTFT) by 1.24\u00d7\u20131.40\u00d7 on 32K\u2013128K prompts."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Step5 NVFP4 MoE on TRTLLM-Gen reaches 1.95\u00d7 decode speedup on 4\u00d7GB200 (#65152)",
              "FlyDSL decode monokernel boosts Muse Spark Open interactivity by 35\u201357% on 8\u00d7MI355X (#63440)",
              "Checkpoint/restore endpoints (/checkpoint/prepare, /checkpoint/restore) via CRIU + cuda-checkpoint (#62570)",
              "Fault-tolerant DP+EP scale-down removes dead ranks without cluster restart (#46370)"
            ]
          }
        ]
      },
      {
        "id": "2026-11-05",
        "date_iso": "2026-11-05",
        "label": "2026-11-05",
        "date_range": "Thursday, 2026-11-05",
        "reading_time": "4 min read",
        "headline": "This Week in vLLM (2026-11-05): LibTorch Stable ABI Migration, Encoder Disaggregation (EPD), and Kimi-K3.1 Pro",
        "intro": "Highlights from the 2026-11-05 development week: CUDA wheels migrate to the PyTorch LibTorch Stable ABI, multimodal serving gains Encoder-Prefill-Decode (EPD) disaggregation, and Kimi-K3.1 Pro lands with day-0 support.",
        "tldr_cards": [
          {
            "tag": "Build & Packaging",
            "title": "CUDA Extensions Migrated to the LibTorch Stable ABI (#55810)",
            "summary": "vLLM's compiled C++/CUDA kernels now bind against PyTorch's binary-stable ABI instead of internal C++ symbols.",
            "impact": "Upgrade compatible PyTorch versions without rebuilding vLLM's CUDA kernels from source.",
            "prs": [
              "#55810"
            ]
          },
          {
            "tag": "Multimodal Serving",
            "title": "Encoder Disaggregation (EPD) Scales Vision & Audio Independently (#59120)",
            "summary": "Separates vision/audio encoder execution onto dedicated workers with remote embedding transfer and cross-encoder caching.",
            "impact": "Prevents heavy image/video encoding bursts from stalling LLM prefill and decode GPUs.",
            "prs": [
              "#59120",
              "#56277"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges",
            "items": [
              {
                "title": "Initialized TP1 engine snapshots with CRIU (vllm snapshot create/restore)",
                "pr": "#51360",
                "what_it_is": "Captures a fully initialized single-GPU vLLM process after model load and CUDA graph capture.",
                "why_you_care": "Restores warm inference replicas in seconds instead of waiting minutes for cold-start compilation."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "DeepSeek-V4.1-Flash MXFP8 KV cache via FlashMLA V4.1 on Blackwell SM100 (#56893)",
              "Granite and Qwen3-ASR added as EAGLE3 speculative decoding targets (#60855, #52824)",
              "DeepSeek-V4 CPU backend with AVX512/AMX sparse MLA and compressor kernels (#55355)"
            ]
          }
        ]
      },
      {
        "id": "2026-10-29",
        "date_iso": "2026-10-29",
        "label": "2026-10-29",
        "date_range": "Thursday, 2026-10-29",
        "reading_time": "3 min read",
        "headline": "This Week in vLLM (2026-10-29): DeepGEMM Mega-mHC Kernels, Async Engram Prefetch, and ROCm 10.0 Preparation",
        "intro": "Highlights from the 2026-10-29 development week: DeepGEMM Mega-mHC kernels and async Engram DP sharding land for DeepSeek-V4, alongside ROCm 10.0 container and wheel updates.",
        "tldr_cards": [
          {
            "tag": "MoE Kernels",
            "title": "DeepGEMM Mega-mHC & Async Engram Prefetch (#56962, #56512)",
            "summary": "Fuses multi-head latent compressor projections with DeepGEMM and overlaps Engram host table prefetching across DP ranks.",
            "impact": "Lowers inter-token latency on DeepSeek-V4 andGLM-5.3 MoE deployments.",
            "prs": [
              "#56962",
              "#56512"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges",
            "items": [
              {
                "title": "GLM-5.3-Flash with DFlash2 drafter and EPLB load balancing",
                "pr": "#56983",
                "what_it_is": "Integrates the DFlash2 block-diffusion speculative drafter with Expert Parallel Load Balancing (EPLB) for GLM-5.3-Flash.",
                "why_you_care": "Prevents hot-expert bottlenecks across multi-GPU MoE ranks while accelerating single-stream decode."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "MiniMax-M3 EAGLE3 speculative decoding at Pipeline Parallelism (PP > 1) on MRV2 (#57197)",
              "Shared target embeddings for Multi-Token Prediction (MTP) under Pipeline Parallelism (#58648)",
              "LoRA support extended to BERT, RoBERTa, and XLM-RoBERTa embedding models (#61033)"
            ]
          }
        ]
      }
    ]
  },
  "kubernetes": {
    "brand": "KubePulse",
    "tagline": "What changed in Kubernetes \u2014 translated from KEPs and changelogs into plain-English upgrade and platform decisions.",
    "weekly": {
      "id": "this-week-in-kubernetes",
      "date_iso": "2026-11-19",
      "date_range": "Thursday, 2026-11-19 (LWKD Digest)",
      "reading_time": "4 min read",
      "headline": "This Week in Kubernetes (2026-11-19): 50% Lower UnstructuredList Memory, Conditional Authorization, and Patch Releases 1.37.2 / 1.36.6",
      "intro": "Modeled on Last Week in Kubernetes Development (LWKD) + Sysdig's operational lens: what merged in upstream Kubernetes this week and what it means for your clusters.",
      "tldr_cards": [
        {
          "tag": "Control Plane Efficiency",
          "title": "Decoding JSON into UnstructuredList Now Uses 50% Less RAM & 33% Less CPU Time",
          "summary": "A major optimization in client/server JSON decoding cuts memory allocations in half when listing Custom Resources (CRDs) and dynamic objects.",
          "impact": "Directly lowers memory spikes in Argo CD, Flux, Kyverno, and custom operators watching large CRD fleets.",
          "prs": [
            "#142575"
          ]
        },
        {
          "tag": "Upgrade Alert",
          "title": "Locked GA `SupplementalGroupsPolicy` Feature Gate Removed + Kubernetes 1.34 Reaches EOL",
          "summary": "The graduated `SupplementalGroupsPolicy` gate has been removed from component flags, and Kubernetes 1.34 officially reached End of Life alongside patch releases 1.37.2, 1.36.6, and 1.35.10.",
          "impact": "Remove `--feature-gates=SupplementalGroupsPolicy=...` from your API server/kubelet manifests before upgrading.",
          "prs": [
            "#142093"
          ]
        },
        {
          "tag": "Storage & StatefulSets",
          "title": "StatefulSet `maxUnavailable` Partition Fix & CSI Controller Node Info (KEP-6011)",
          "summary": "StatefulSet rolling updates no longer count unavailable pods below the partition against your `maxUnavailable` budget, and KEP-6011 moves CSI cloud topology queries off worker nodes.",
          "impact": "Safer canary rollouts for databases and no more cloud IAM credentials needed on worker nodes for CSI volume limits.",
          "prs": [
            "#143114",
            "#143644"
          ]
        }
      ],
      "sections": [
        {
          "category": "Featured Merges (Plain-English Breakdown)",
          "items": [
            {
              "title": "Volume Health APIs move into PodStatus.VolumeStatus (KEP-1432)",
              "pr": "#143644",
              "pr_url": "https://github.com/kubernetes/kubernetes/pull/143644",
              "what_it_is": "Standardizes how CSI storage drivers report `Healthy` and `Unknown` disk conditions directly on `PodStatus.VolumeStatus`.",
              "why_you_care": "Your stateful operators (Postgres, Kafka, AI checkpoint jobs) can now detect failing cloud disks via the Kubernetes Pod API before I/O hangs."
            },
            {
              "title": "client-go leader election adds write-gating and leader recovery",
              "pr": "#143289",
              "pr_url": "https://github.com/kubernetes/kubernetes/pull/143289",
              "what_it_is": "Hardens `client-go` leader election so a deposed controller immediately stops issuing stale API writes while the new leader takes over faster.",
              "why_you_care": "Prevents split-brain race conditions in custom controllers during control-plane network blips."
            }
          ]
        },
        {
          "category": "Other Notable Merges & Patch Releases",
          "bullets": [
            "Patch releases v1.37.2, v1.36.6, v1.35.10, and v1.34.13 are out on Go 1.26.10",
            "CRD types and clients move to the standalone `k8s.io/apiextensions-api` Go module (#142746)",
            "kube-apiserver adds conditional authorization support (#141959)",
            "New `WatchFromStorageWithoutPrevKV` feature gate lets etcd watches skip sending previous KV payloads (#131862)",
            "kubelet adds `kubelet_sync_result_errors_total` and `kubelet_pod_worker_errors_total` Prometheus metrics (#143284)"
          ]
        }
      ]
    },
    "releases": [
      {
        "version": "v1.37",
        "badge": "Latest Release (Garhwal)",
        "date": "2026-08-26",
        "stats": "67 enhancements \u00b7 16 Stable \u00b7 23 Beta \u00b7 27 Alpha",
        "headline": "HPA Scale-to-Zero Enabled by Default, Beta Gang Scheduling, and Resilient API Server Watch Cache",
        "executive_summary": "Kubernetes 1.37 ('Garhwal') is a huge release for AI/GPU platforms and cost-conscious cluster operators. HorizontalPodAutoscaler (HPA) Scale-to-Zero graduates to Beta (enabled by default), native Gang Scheduling (`Workload` / `PodGroup`) reaches Beta with workload-aware preemption, and Resilient WatchCache Initialization finishes graduating to Stable\u2014protecting `etcd` from startup list storms.",
        "five_parts": {
          "big_deal": [
            {
              "title": "HPA Scale-to-Zero Is Now Beta & Enabled by Default (KEP-2021)",
              "status": "Beta (On by Default)",
              "status_tone": "green",
              "prs": [
                "KEP-2021"
              ],
              "before": "In standard Kubernetes, `HorizontalPodAutoscaler` required at least 1 running replica (`minReplicas: 1`) unless you manually enabled alpha feature gates or installed KEDA.",
              "now": "Workloads driven by external or object metrics (like queue depth or pending inference requests) can set `spec.minReplicas: 0` out of the box. Kubernetes parks the deployment at 0 pods when idle and wakes it up automatically when work arrives.",
              "config_snippet": "apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  minReplicas: 0   # Now works out-of-the-box in v1.37!\n  maxReplicas: 32"
            },
            {
              "title": "Native Gang Scheduling (`PodGroup`) Graduates to Beta with Preemption (KEP-4671)",
              "status": "Beta",
              "status_tone": "cyan",
              "prs": [
                "KEP-4671",
                "KEP-5710"
              ],
              "before": "Scheduling a 16-pod distributed PyTorch or Ray job without Kueue/Volcano risked placing 14 pods that sat idle burning GPU money while waiting for the last 2 pods.",
              "now": "Native all-or-nothing gang scheduling via `PodGroup` and the new `spec.scheduling` field on `batch/v1 Job` ensures the scheduler only binds pods when the entire group fits\u2014plus workload-aware preemption.",
              "config_snippet": "apiVersion: batch/v1\nkind: Job\nspec:\n  parallelism: 8\n  scheduling:\n    podGroup:\n      minMember: 8"
            },
            {
              "title": "Resilient WatchCache Initialization Locked to Stable (KEP-4568)",
              "status": "Stable / GA",
              "status_tone": "green",
              "prs": [
                "KEP-4568"
              ],
              "before": "When `kube-apiserver` restarted in a large cluster, hundreds of controllers hammered `etcd` with uncached LIST requests while the watch cache warmed up\u2014often causing cascading control-plane outages.",
              "now": "The API server gracefully throttles expensive uncached requests with `HTTP 429 Too Many Requests` (`Retry-After`) while warming the watch cache, keeping `etcd` rock-solid.",
              "config_snippet": "# Locked on by default in v1.37 (ensure custom controllers respect HTTP 429 Retry-After)"
            },
            {
              "title": "Scheduler Preemption for Deferred In-Place Pod Resizes (KEP-1287)",
              "status": "Alpha",
              "status_tone": "cyan",
              "prs": [
                "KEP-1287"
              ],
              "before": "After In-Place Pod Vertical Scaling graduated to Stable in v1.35, a pod requesting more CPU/RAM on a full node stayed stuck in `Deferred` state forever if no capacity freed up.",
              "now": "The control plane can now actively preempt lower-priority pods on that node so a critical workload's in-place vertical resize succeeds without restarting.",
              "config_snippet": "--feature-gates=InPlacePodVerticalScalingSchedulerPreemption=true"
            }
          ],
          "who_benefits": [
            {
              "persona": "Bursty GPU & Queue Worker Fleets",
              "models": "Async inference queues, CI runners, batch consumers",
              "gpus": "Autoscaled GPU & CPU node pools",
              "impact": "100% compute savings during idle off-hours with built-in HPA `minReplicas: 0`."
            },
            {
              "persona": "Distributed AI Training & Multi-Node Inference",
              "models": "Multi-node PyTorch, vLLM LWS/Ray, MPI jobs",
              "gpus": "H100 / B200 GPU clusters",
              "impact": "Eliminates deadlocked partial GPU allocations via Beta native Gang Scheduling."
            },
            {
              "persona": "Large Multi-Tenant Platform Teams",
              "models": "Clusters with 1,000+ nodes or heavy CRD operators",
              "gpus": "Control plane (`kube-apiserver` & `etcd`)",
              "impact": "Prevents `etcd` OOM outages during API server rolling upgrades."
            }
          ],
          "jargon_decoded": [
            {
              "term": "Gang Scheduling (`PodGroup`)",
              "plain_english": "An 'all-or-nothing' rule for the Kubernetes scheduler: if a distributed job needs 8 GPUs across 8 pods, don't start any of them until all 8 slots are ready simultaneously.",
              "bottom_line": "Stops half-scheduled jobs from hogging expensive GPUs while deadlocked."
            },
            {
              "term": "WatchCache & `HTTP 429` Backpressure",
              "plain_english": "The API server's in-memory cache of cluster state so it doesn't have to query the `etcd` database on every request.",
              "bottom_line": "Protects your cluster's brain (`etcd`) from melting down during restarts."
            }
          ],
          "upgrade_guide": {
            "verdict": "Upgrade Recommended \u2014 Check custom operators for HTTP 429 retry compliance.",
            "rows": [
              {
                "change": "`WatchCacheInitializationPostStartHook` locked to Stable",
                "impact": "Uncached LIST requests during API server startup receive `HTTP 429` instead of blocking on `etcd`.",
                "action": "Ensure custom controllers use standard `client-go` backoff (`Retry-After`).",
                "pr": "KEP-4568"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Idle Queue Worker Compute Spend",
              "hardware": "HPA Scale-to-Zero (`minReplicas: 0`)",
              "metric": "0 idle pods during off-peak",
              "pct_bar": 92,
              "pr": "KEP-2021"
            },
            {
              "label": "API Server Startup etcd Load",
              "hardware": "Resilient WatchCache Initialization (GA)",
              "metric": "Eliminates startup LIST spikes",
              "pct_bar": 85,
              "pr": "KEP-4568"
            }
          ]
        }
      },
      {
        "version": "v1.36",
        "badge": "Release",
        "date": "2026-04-22",
        "stats": "347 upstream changes and 187 PRs",
        "headline": "Dynamic Resource Allocation, Feature Enhancements",
        "executive_summary": "Translating KUBERNETES v1.36 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-5055",
                "KEP-5007",
                "#5055",
                "#137170"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Dynamic Resource Allocation.",
              "now": "DRA: Graduated device taints and tolerations (KEP #5055) to beta. Support for DeviceTaints in ResourceSlices is on by default. Support for `DeviceTaintRules` depends on...; DRA: Graduated Device Binding Conditions (KEP #5007) to beta, enabled by default in `v1.36`. ([#137795](https://github.com/kubernetes/kubernetes/pull/137795),...; DRA ResourceSlice controller: Added optional `ReconcilePoolWithName` to allow per-pool reconciliation without setting `NodeName` on slices, so the scheduler can use...; ACTION REQUIRED: DRA (Dynamic Resource Allocation) drivers and controllers now require granular RBAC permissions to update ResourceClaim statuses when the...; Added list-type support for attributes in DRA (KEP-5491). The `DRAListTypeAttributes` feature gate (disabled by default) activates the following enhancements:",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#135462",
                "#135773",
                "#136008"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "Client-go: Default informer behavior now updates store state with all the objects in a list or relist before calling handler `OnDelete`, `OnAdd`, or `OnUpdate` methods for...; Kubeadm: Removed the `ControlPlaneKubeletLocalMode` feature gate, which graduated to GA in `v1.35` and was locked to enabled....; Client-go: Improved informer resync processing to reduce contention on store locks between incoming events and handler updates, which may result in observable timing...; Client-go: Informers can now enqueue new watch events while already-queued events are being processed. This avoids dropping watches during a burst of incoming events due to...; Graduated `ComponentFlagz` to beta. ([#137386](https://github.com/kubernetes/kubernetes/pull/137386), [@richabanker](https://github.com/richabanker)) [SIG API Machinery,...",
              "config_snippet": ""
            },
            {
              "title": "Workload-Aware & Gang Scheduling (`PodGroup` / `Job` / Queueing)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#137201",
                "#136589",
                "#137271"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Workload-Aware & Gang Scheduling.",
              "now": "Added the PlacementScore extension point to the scheduler for scoring placements in placement-based PodGroup scheduling, guarded by the `TopologyAwareWorkloadScheduling`...; Added `DisruptionMode`, `PriorityClassName`, and `Priority` fields to the Workload and PodGroup APIs to support workload-aware preemption when the `WorkloadAwarePreemption`...; Added SchedulingConstraints to express topology-aware scheduling (TAS) constraints for PodGroup scheduling behind the `TopologyAwareWorkloadScheduling` feature gate. Added the...; Added placement-based PodGroup scheduling algorithm to the scheduler. Its use is guarded by the `TopologyAwareWorkloadScheduling` feature gate....; Added the PlacementGenerate extension point to the scheduler. It is used to generate placements for placement-based PodGroup scheduling. Its use is guarded by the...",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#135322",
                "#136230",
                "#137544"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Change Enhancements.",
              "now": "Removed the in-tree Portworx volume plugin, completing the migration to CSI. Removed the GA `CSIMigrationPortworx` feature gate (locked since `v1.33`) and alpha...; Promoted mutable CSI node allocatable count to GA. The `MutableCSINodeAllocatableCount` feature gate is locked to enabled....; Promoted the `NodeLogQuery` feature gate to GA. ([#137544](https://github.com/kubernetes/kubernetes/pull/137544), [@jrvaldes](https://github.com/jrvaldes)) [SIG Node and Windows]; Added stability-based lifecycle for declarative validation (Alpha/Beta/Stable). Scheduling Workload `v1alpha1` now uses explicit declarative enforcement....; Added `spec.stubPKCS10Request` to the Pod Certificates beta API to improve compatibility with existing certificate authority implementations that expect a PKCS#10 certificate...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "models": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
              "gpus": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
              "impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Workload-Aware & Gang Scheduling (`PodGroup` / `Job` / Queueing)",
              "models": "Distributed AI training, multi-node batch jobs, Ray/Spark clusters, and MPI workloads",
              "gpus": "High-density GPU/CPU batch pools and `kube-scheduler` queues",
              "impact": "Prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "ACTION REQUIRED: kube-controller-manager: Renamed metric `volume_operation_total_errors` to `volume_operation_errors_total`. If you are using custom monitoring dashboards or alerting rules based on the `volume_operation_",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#136399"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Added support for running PreBind plugins in parallel in the scheduler framework to improve binding latency. ACTION REQUIRED: Plugins can opt-in to parallel execution by returning `AllowParallel: true` from the `PreBindP",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#135393"
              },
              {
                "change": "Deprecation",
                "impact": "Added warnings and deprecation for Service `.spec.externalIPs`. ([#137293](https://github.com/kubernetes/kubernetes/pull/137293), [@adrianmoisey](https://github.com/adrianmoisey)) [SIG Apps, Network and Windows]",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#137293"
              },
              {
                "change": "Deprecation",
                "impact": "Direct access to the `Raw` field of `metav1.FieldsV1` is deprecated. Code that constructs or reads `FieldsV1` should migrate to the new `NewFieldsV1(string)`, `GetRawBytes()`, `GetRawString()`, and `SetRawBytes()` access",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#137304"
              },
              {
                "change": "Deprecation",
                "impact": "Disabled `git-repo` volume plugin by default, with no option to turn it back on. ([#136400](https://github.com/kubernetes/kubernetes/pull/136400), [@vinayakankugoyal](https://github.com/vinayakankugoyal)) [SIG Storage]",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#136400"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "DRA: Graduated device taints and tolerations (KEP #5055) to beta. Support for DeviceTaints in ResourceSlices is on by default. Support for `DeviceTaintRules` de",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5055"
            },
            {
              "label": "API Change",
              "hardware": "DRA: Graduated Device Binding Conditions (KEP #5007) to beta, enabled by default in `v1.36`. ([#137795](https://github.com/kubernetes/kubernetes/pull/137795), [",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5007"
            },
            {
              "label": "API Change",
              "hardware": "Removed the in-tree Portworx volume plugin, completing the migration to CSI. Removed the GA `CSIMigrationPortworx` feature gate (locked since `v1.33`) and alpha",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#135322"
            },
            {
              "label": "Feature",
              "hardware": "Kube-apiserver: Graduated the `UnknownVersionInteroperabilityProxy` feature gate to beta, enabled by default. The `--peer-ca-file` flag is required to turn on t",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#137172"
            },
            {
              "label": "Feature",
              "hardware": "Kubeadm: Removed the `ControlPlaneKubeletLocalMode` feature gate, which graduated to GA in `v1.35` and was locked to enabled. ([#135773](https://github.com/kube",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#135773"
            }
          ]
        }
      },
      {
        "version": "v1.35",
        "badge": "Timbernetes Release",
        "date": "2025-12-17",
        "stats": "60 enhancements \u00b7 17 Stable \u00b7 19 Beta \u00b7 22 Alpha",
        "headline": "In-Place Pod Vertical Scaling Reaches GA (Stable) and Native Pod Certificates Enter Beta",
        "executive_summary": "Kubernetes 1.35 ('Timbernetes') graduates one of the most requested features in Kubernetes history to General Availability: In-Place Update of Pod Resources (KEP-1287), allowing you to resize CPU and memory on running pods without restarting them. It also brings native kubelet-issued mTLS Pod Certificates to Beta.",
        "five_parts": {
          "big_deal": [
            {
              "title": "In-Place Pod CPU & Memory Resize Graduates to Stable (KEP-1287)",
              "status": "Stable / GA",
              "status_tone": "green",
              "prs": [
                "KEP-1287"
              ],
              "before": "Changing a Pod's CPU or memory limits required killing the Pod and creating a new one\u2014dropping active connections and forcing slow model/cache reloads.",
              "now": "Patch the `resources` subresource on a running Pod and `kubelet` updates Linux cgroup limits in place with zero restart.",
              "config_snippet": "kubectl patch pod my-llm-server --subresource resize --patch \\\n  '{\"spec\":{\"containers\":[{\"name\":\"vllm\",\"resources\":{\"requests\":{\"cpu\":\"16\"}}}]}}'"
            },
            {
              "title": "Native Pod Certificates for Workload Identity & mTLS (KEP-4317)",
              "status": "Beta",
              "status_tone": "cyan",
              "prs": [
                "KEP-4317"
              ],
              "before": "Zero-trust pod mTLS required external controllers (cert-manager, SPIRE), init containers, and Secret volume mounts.",
              "now": "`kubelet` generates private keys locally, requests X.509 certificates via `PodCertificateRequest`, and rotates credential bundles directly into the Pod filesystem.",
              "config_snippet": "# Native mTLS credential bundles mounted and rotated by kubelet"
            }
          ],
          "who_benefits": [
            {
              "persona": "Stateful Services & Warm AI Inference Pods",
              "models": "Databases, JVMs, in-memory caches, and warm vLLM servers",
              "gpus": "All Linux worker nodes",
              "impact": "Scale CPU/RAM up for traffic spikes and back down afterward without a single dropped request or cold-start."
            }
          ],
          "jargon_decoded": [
            {
              "term": "In-Place Vertical Scaling",
              "plain_english": "Giving a running container more (or less) CPU and RAM on the fly without restarting the process inside it.",
              "bottom_line": "No more choosing between over-provisioning RAM 24/7 or suffering a 5-minute restart outage."
            }
          ],
          "upgrade_guide": {
            "verdict": "Must-Have Upgrade \u2014 In-Place Pod Resize GA alone justifies moving to 1.35+.",
            "rows": [
              {
                "change": "cgroup v1 support moved to maintenance mode",
                "impact": "Modern vertical scaling and memory QoS features require cgroup v2 Linux nodes.",
                "action": "Verify all worker node OS images run cgroup v2.",
                "pr": "KEP-1287"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Pod Vertical Resize Downtime",
              "hardware": "In-Place Pod Resource Update (GA)",
              "metric": "0ms container restart downtime",
              "pct_bar": 100,
              "pr": "KEP-1287"
            }
          ]
        }
      },
      {
        "version": "v1.34",
        "badge": "Of Wind & Will",
        "date": "2025-08-27",
        "stats": "58 enhancements \u00b7 23 Stable \u00b7 22 Beta \u00b7 13 Alpha",
        "headline": "Dynamic Resource Allocation (DRA) Core Reaches GA for GPUs, Plus Stable OpenTelemetry Tracing",
        "executive_summary": "Kubernetes 1.34 graduates the core of Dynamic Resource Allocation (`resource.k8s.io/v1`) to General Availability\u2014replacing rigid integer device plugins with a flexible API for GPUs, NICs, and accelerators\u2014while graduating API server and kubelet OpenTelemetry tracing to Stable.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Dynamic Resource Allocation (DRA) Core Reaches GA (`resource.k8s.io/v1`)",
              "status": "Stable / GA",
              "status_tone": "green",
              "prs": [
                "KEP-4381"
              ],
              "before": "Kubernetes Device Plugins could only count GPUs as dumb integers (`nvidia.com/gpu: 1`) with no native way to express GPU sharing, NVLink topology, or custom driver parameters.",
              "now": "DRA (`ResourceClaim`, `DeviceClass`) is Stable under `resource.k8s.io/v1`, enabling structured GPU sharing, topology alignment, and safe admin diagnostic access.",
              "config_snippet": "apiVersion: resource.k8s.io/v1\nkind: ResourceClaimTemplate\nspec:\n  spec:\n    devices:\n      requests:\n      - name: gpu\n        exactly:\n          deviceClassName: gpu.nvidia.com"
            },
            {
              "title": "Snapshottable API Server Cache & WatchList Streaming",
              "status": "Beta (On by Default)",
              "status_tone": "cyan",
              "prs": [
                "KEP-4988"
              ],
              "before": "Paginated `LIST` calls from controllers bypassed the watch cache and hit `etcd` directly, causing heavy database load and memory spikes.",
              "now": "`ListFromCacheSnapshot` serves paginated list continuations directly from API server memory snapshots instead of `etcd`.",
              "config_snippet": "# Enabled by default in v1.34 via ListFromCacheSnapshot=true"
            }
          ],
          "who_benefits": [
            {
              "persona": "GPU & AI Infrastructure Teams",
              "models": "Multi-GPU LLM serving, MIG/fractional GPU pods, RDMA workloads",
              "gpus": "NVIDIA / AMD GPUs & InfiniBand NICs",
              "impact": "Standardized Kubernetes API (`resource.k8s.io/v1`) for rich accelerator allocation and sharing."
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Think of it as `PersistentVolumeClaims` (`PVC`), but for GPUs and specialized hardware instead of disks.",
              "bottom_line": "Lets pods request specific GPU attributes, share a single GPU safely, or align across NVLink."
            }
          ],
          "upgrade_guide": {
            "verdict": "Recommended Upgrade \u2014 Foundation for all modern GPU scheduling on Kubernetes.",
            "rows": [
              {
                "change": "DRA kubelet gRPC API graduated to `v1` (`v1beta1` deprecated)",
                "impact": "Third-party DRA hardware drivers must support the `v1` kubelet plugin API.",
                "action": "Upgrade your NVIDIA/AMD DRA driver daemonsets when upgrading to 1.34+.",
                "pr": "KEP-4381"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Paginated LIST etcd Offload",
              "hardware": "Snapshottable Watch Cache (`ListFromCacheSnapshot`)",
              "metric": "Served from RAM instead of etcd",
              "pct_bar": 90,
              "pr": "KEP-4988"
            }
          ]
        }
      },
      {
        "version": "v1.33",
        "badge": "Release",
        "date": "2025-04-23",
        "stats": "261 upstream changes and 151 PRs",
        "headline": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle, API Server & etcd Watch/Cache Efficiency at Scale",
        "executive_summary": "Translating KUBERNETES v1.33 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#129731",
                "#130058",
                "#125230"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle.",
              "now": "The `SidecarContainers` feature has graduated to GA. 'SidecarContainers' feature gate was locked to default value and will be removed in v1.36. If you were setting this feature...; Introduced the `LegacySidecarContainers` feature gate enabling the legacy code path that predates the `SidecarContainers` feature. This temporary feature gate is disabled by...; Graduated image volume sources to beta:; kubectl: Added alpha support for customizing kubectl behavior using preferences from a `kuberc` file, separate from `kubeconfig`....; Allowed `ImageVolume` for Restricted PSA profiles. ([#130394](https://github.com/kubernetes/kubernetes/pull/130394), [@Barakmor1](https://github.com/Barakmor1))",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#130560",
                "#129589",
                "#129934"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Server & etcd Watch/Cache Efficiency at Scale.",
              "now": "The `RemoteRequestHeaderUID` feature moves to beta and is now enabled by default. This makes the kube-apiserver propagate UIDs in the `X-Remote-Uid` header in requests to the...; kubeadm: removed the feature gate EtcdLearnerMode which graduated to GA in 1.32. ([#129589](https://github.com/kubernetes/kubernetes/pull/129589),...; Graduated `BtreeWatchCache` feature gate to GA. ([#129934](https://github.com/kubernetes/kubernetes/pull/129934), [@serathius](https://github.com/serathius)); kube-apiserver: Promoted the  `ServiceAccountTokenNodeBinding` feature gate general availability. It is now locked to enabled....; The `ClusterTrustBundle` API is moving to `v1beta1`. In order for the `ClusterTrustBundleProjection` feature to work on the kubelet side, the `ClusterTrustBundle` API must be...",
              "config_snippet": ""
            },
            {
              "title": "In-Place Pod Vertical Scaling (Zero-Restart Resource Resize)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#130905",
                "#130574",
                "#130880"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in In-Place Pod Vertical Scaling.",
              "now": "Promoted in-place Pod vertical scaling to beta. The `InPlacePodVerticalScaling` feature gate is now enabled by default....; For the `InPlacePodVerticalScaling` feature, the API server will no longer set the resize status to `Proposed` upon receiving a resize request....; The feature gate `InPlacePodVerticalScalingAllocatedStatus` is deprecated and no longer used. The `AllocatedResources` field in `ContainerStatus` is now guarded by the...; InPlacePodVerticalScaling: Memory limits cannot be decreased unless the memory resize restart policy is set to `RestartContainer`. Container resizePolicy is no longer mutable....; The pod `status.resize` field is now deprecated and will no longer be set. The status of a pod resize will be exposed under two new conditions: `PodResizeInProgress` and...",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#129713",
                "#130728",
                "#130772"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "Graduated the `DisableNodeKubeProxyVersion` feature gate to enable by default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for its associated...; The `DeclarativeValidation` feature gate is enabled by default. When enabled, mismatches with existing hand written validation is reported via metrics. The...; Added `SchedulerPopFromBackoffQ` feature gate that is in beta and enabled by default. Improved scheduling queue behavior by popping pods from the backoffQ when the activeQ is...; Bumped `ProcMountType` feature to on by default beta ([#130798](https://github.com/kubernetes/kubernetes/pull/130798), [@haircommander](https://github.com/haircommander)) [SIG...; Graduated the `KubeletFineGrainedAuthz` feature gate to beta; the gate is now enabled by default. ([#129656](https://github.com/kubernetes/kubernetes/pull/129656),...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "models": "Service-mesh pods, telemetry agents, fast-restoring stateful apps, and OCI artifact mounts",
              "gpus": "Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes",
              "impact": "Stops zombie sidecars from holding batch nodes open after job completion"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "In-Place Pod Vertical Scaling (Zero-Restart Resource Resize)",
              "models": "Stateful microservices, warm inference engines, JVMs, and suspended Batch Jobs needing CPU/RAM adjustments",
              "gpus": "Linux worker nodes and kubelet resource allocation loops",
              "impact": "Eliminates over-provisioning buffer and avoids expensive pod restart cold-starts during traffic spikes"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Added the ability to reduce both the initial delay and the maximum delay accrued between container restarts for a node for containers in `CrashLoopBackOff` across the cluster to the recommended values of `1s` initial del",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#130711"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "[Action Required] CSI drivers that call IsLikelyNotMountPoint should not assume false means that the path is a mount point. Each CSI driver needs to make sure correct usage of return value of IsLikelyNotMountPoint becaus",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#129370"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Fixed the behavior of the `KUBE_PROXY_NFTABLES_SKIP_KERNEL_VERSION_CHECK` environment variable in the nftables proxier. The kernel version check is now skipped only when this variable is explicitly set to a non-empty val",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#130401"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Renamed `UpdatePodTolerations` action type to `UpdatePodToleration`. Action required for custom plugin developers to update their code to follow the rename. ([#129023](https://github.com/kubernetes/kubernetes/pull/129023",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#129023"
              },
              {
                "change": "Deprecation",
                "impact": "The EndpointSlice `hints` field has graduated to GA. The beta annotation `service.kubernetes.io/topology-mode` is now considered deprecated and will not graduate to GA. It remains operational for backward compatibility. ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#130742"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "Graduated the `MultiCIDRServiceAllocator` feature gate to stable, and the `DisableAllocatorDualWrite` feature gate to beta (disabled by default). Action require",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128971"
            },
            {
              "label": "Feature",
              "hardware": "The `SidecarContainers` feature has graduated to GA. 'SidecarContainers' feature gate was locked to default value and will be removed in v1.36. If you were sett",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#129731"
            },
            {
              "label": "Feature",
              "hardware": "Promoted in-place Pod vertical scaling to beta. The `InPlacePodVerticalScaling` feature gate is now enabled by default. ([#130905](https://github.com/kubernetes",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#130905"
            },
            {
              "label": "Feature",
              "hardware": "The `RemoteRequestHeaderUID` feature moves to beta and is now enabled by default. This makes the kube-apiserver propagate UIDs in the `X-Remote-Uid` header in r",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#130560"
            },
            {
              "label": "Feature",
              "hardware": "Graduated the `DisableNodeKubeProxyVersion` feature gate to enable by default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for it",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#129713"
            }
          ]
        }
      },
      {
        "version": "v1.32",
        "badge": "Release",
        "date": "2024-12-11",
        "stats": "298 upstream changes and 135 PRs",
        "headline": "Dynamic Resource Allocation, API Server & etcd Watch/Cache Efficiency at Scale",
        "executive_summary": "Translating KUBERNETES v1.32 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#127266",
                "#128003",
                "#127511"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Dynamic Resource Allocation.",
              "now": "DRA: the `DeviceRequestAllocationResult` struct now has an \"AdminAccess\" field which should be used instead of the corresponding field in the `DeviceRequest` field when dealing...; Removed all support for _classic_ dynamic resource allocation (DRA). The `DRAControlPlaneController` feature gate, formerly alpha, is no longer available. Kubernetes now only...; The core functionality of Dynamic Resource Allocation (DRA) got promoted to beta. No action is required when *upgrading*, the previous v1alpha3 API is still supported, so...; DRA: scheduling pods is up to 16x faster, depending on the scenario. Scheduling throughput depends a lot on cluster utilization. It is higher for lightly loaded clusters with...; Added metrics to measure the latency of DRA Node operations and DRA GRPC calls ([#127146](https://github.com/kubernetes/kubernetes/pull/127146),...",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#128053",
                "#128539",
                "#128172"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Server & etcd Watch/Cache Efficiency at Scale.",
              "now": "Graduated the `WatchList` feature gate to Beta for kube-apiserver and enabled `WatchListClient` for KCM. ([#128053](https://github.com/kubernetes/kubernetes/pull/128053),...; Added the feature gate CBORServingAndStorage to allow CBOR as the encoding for API request and response bodies, and as the storage encoding for custom resources. Clients must...; kube-apiserver: Promoted the `StructuredAuthorizationConfiguration` feature gate to GA. The `--authorization-config` flag now accepts `AuthorizationConfiguration` in version...; Promoted `CustomResourceFieldSelectors` to stable; the feature was enabled by default. The `--feature-gates=CustomResourceFieldSelectors=true` flag was no longer needed on...; Promoted `RetryGenerateName` to stable; the feature is enabled by default. `--feature-gates=RetryGenerateName=true` not needed on kube-apiserver binaries and will be removed in...",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#124003",
                "#126465",
                "#127981"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Change Enhancements.",
              "now": "kube-scheduler removed `AzureDiskLimits` ,`CinderLimits` `EBSLimits` and `GCEPDLimits` plugin. Given the corresponding CSI driver reports how many volumes a node can handle in...; ACTION REQUIRED for custom scheduler plugin developers: `PodEligibleToPreemptOthers` in the `preemption` interface now includes `ctx` in the parameters. Please update your...; Implemented a new, alpha `seLinuxChangePolicy` field within a Pod-level `securityContext`, under SELinuxChangePolicy feature gate. This field allows for opting out from...; Added the ability to change the maximum backoff delay accrued between container restarts for a node for containers in `CrashLoopBackOff`. To set this for a node, turn on the...; Added alpha support for asynchronous Pod preemption. When the `SchedulerAsyncPreemption` feature gate is enabled, the scheduler now runs API calls to trigger preemptions...",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#128472",
                "#126897",
                "#127009"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "Graduated `SchedulerQueueingHints` to beta; the feature gate is now enabled by default. ([#128472](https://github.com/kubernetes/kubernetes/pull/128472),...; Promoted the `RelaxedEnvironmentVariableValidation` feature gate to beta and is enabled by default. ([#126897](https://github.com/kubernetes/kubernetes/pull/126897),...; Graduated the AnonymousAuthConfigurableEndpoints feature gate to beta and enable by default to allow configurable endpoints for anonymous authentication....; Promoted `SizeMemoryBackedVolumes` to stable. ([#126981](https://github.com/kubernetes/kubernetes/pull/126981), [@kannon92](https://github.com/kannon92)) [SIG Node, Storage and...; Promoted the `ServiceAccountTokenNodeBindingValidation` feature to GA, which validates service account tokens bound directly to nodes....",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "models": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
              "gpus": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
              "impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Deprecation",
                "impact": "Reverted the `DisableNodeKubeProxyVersion` feature gate to default-off to give a full year from deprecation announcement in 1.29 to clearing the field by default, per the [Kubernetes deprecation policy](https://kubernete",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#126720"
              },
              {
                "change": "Deprecation",
                "impact": "ServiceAccount metadata.annotations[kubernetes.io/enforce-mountable-secrets]: deprecated since v1.32; no removal deadline. Prefer separate namespaces to isolate access to mounted secrets. ([#128396](https://github.com/ku",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#128396"
              },
              {
                "change": "API Change",
                "impact": "DRA: the `DeviceRequestAllocationResult` struct now has an \"AdminAccess\" field which should be used instead of the corresponding field in the `DeviceRequest` field when dealing with an allocation. If a device is only all",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#127266"
              },
              {
                "change": "API Change",
                "impact": "Removed all support for _classic_ dynamic resource allocation (DRA). The `DRAControlPlaneController` feature gate, formerly alpha, is no longer available. Kubernetes now only uses the _structured parameters_ model (also ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#128003"
              },
              {
                "change": "Feature",
                "impact": "Added the feature gate CBORServingAndStorage to allow CBOR as the encoding for API request and response bodies, and as the storage encoding for custom resources. Clients must opt in; programs built with client-go can do ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#128539"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Feature",
              "hardware": "Graduated the `WatchList` feature gate to Beta for kube-apiserver and enabled `WatchListClient` for KCM. ([#128053](https://github.com/kubernetes/kubernetes/pul",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128053"
            },
            {
              "label": "API Change",
              "hardware": "Removed all support for _classic_ dynamic resource allocation (DRA). The `DRAControlPlaneController` feature gate, formerly alpha, is no longer available. Kuber",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128003"
            },
            {
              "label": "API Change",
              "hardware": "Introduced `v1alpha1` API for mutating admission policies, enabling extensible #     admission control via CEL expressions (KEP  3962: Mutating Admission Polici",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#127134"
            },
            {
              "label": "API Change",
              "hardware": "The core functionality of Dynamic Resource Allocation (DRA) got promoted to beta. No action is required when *upgrading*, the previous v1alpha3 API is still sup",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#127511"
            },
            {
              "label": "API Change",
              "hardware": "kube-apiserver: Promoted the `StructuredAuthorizationConfiguration` feature gate to GA. The `--authorization-config` flag now accepts `AuthorizationConfiguratio",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128172"
            }
          ]
        }
      },
      {
        "version": "v1.31",
        "badge": "Release",
        "date": "2024-08-13",
        "stats": "333 upstream changes and 164 PRs",
        "headline": "API Server & etcd Watch/Cache Efficiency at Scale, Workload Identity, User Namespaces & Fine-Grained Authz",
        "executive_summary": "Translating KUBERNETES v1.31 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-1880",
                "#125591",
                "#125582",
                "#125374"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Server & etcd Watch/Cache Efficiency at Scale.",
              "now": "Graduated the `WatchList` feature gate to beta for kube-apiserver and enabled `WatchListClient` for kube-controller-manager (KCM)....; Kubeadm: added the ControlPlaneKubeletLocalMode feature gate. It can be used to tell kubeadm to use the local kube-apiserver endpoint for the kubelet when creating a cluster...; Promoted `StatefulSetStartOrdinal` to stable. This means `--feature-gates=StatefulSetStartOrdinal=true` are not needed on kube-apiserver and kube-controller-manager binaries...; Introduces new functionality to the client-go's `List` method, allowing users to enable API streaming. To activate this feature, users can set the `client-go.WatchListClient`...; Introduces new functionality to the dynamic client's `List` method, allowing users to enable API streaming. To activate this feature, users can set the...",
              "config_snippet": ""
            },
            {
              "title": "Workload Identity, User Namespaces & Fine-Grained Authz",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-3619",
                "#126014",
                "#124997",
                "#125257"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Workload Identity, User Namespaces & Fine-Grained Authz.",
              "now": "Promoted `LocalStorageCapacityIsolation` to beta; the behaviour is enabled by default. Within the kubelet, storage capacity isolation is active if the feature gate is enabled...; Kubeadm: deprecated the kubeadm `RootlessControlPlane` feature gate (previously alpha), given that the core K8s `UserNamespacesSupport` feature gate graduated to beta in 1.30....; Graduated Kubernetes' support for AppArmor to GA. You now cannot disable the `AppArmor` feature gate. ([#125257](https://github.com/kubernetes/kubernetes/pull/125257),...; Kube-apiserver: when the Alpha `UserNamespacesPodSecurityStandards` feature gate is enabled, Pod Security Admission enforcement of the baseline policy now allows `procMount:...; Added a `.status.features.supplementalGroupsPolicy` field to Nodes. The field is true when the feature is implemented in the CRI implementation (KEP-3619)....",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#125828",
                "#125528",
                "#124673"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "Promoted CRI communication of the cgroup driver mechanism to beta. The `KubeletCgroupDriverFromCRI` feature gate is now in beta and enabled by default. This allows the kubelet...; To turn off PortForward over WebSockets for kubectl, the environment variable feature gate must be explicitly set - PORT_FORWARD_WEBSOCKETS=false...; Promoted `generateName` retries to beta, and made the `NameGenerationRetries` feature gate enabled by default. You can read https://kep.k8s.io/4420 for more details....; The feature-gate CSIMigrationPortworx was promoted to beta in Kubernetes 1.25, but turned off by default. In 1.31, it was turned on by default. Before upgrading to 1.31, please...; Enforced kubelet to request serving certificates only once it has at least one IP address in the `.status.addresses` of its associated Node object. This avoids requesting...",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#123845",
                "#126139",
                "#123638"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Change Enhancements.",
              "now": "Graduated the `DisableNodeKubeProxyVersion` feature gate to beta. By default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for its associated...; Reverted a [change](https://github.com/kubernetes/kubernetes/pull/123513) where `ConsistentListFromCache` was moved to beta and enabled by default....; Graduated MatchLabelKeys/MismatchLabelKeys feature in PodAffinity/PodAntiAffinity to Beta. ([#123638](https://github.com/kubernetes/kubernetes/pull/123638),...; The `AuthorizeNodeWithSelectors` feature gate changes node authorizer behavior to limit requests from node API clients, so that each Node can only get / list / watch its own...; Removed feature gate `CustomResourceValidationExpressions`. ([#126136](https://github.com/kubernetes/kubernetes/pull/126136), [@cici37](https://github.com/cici37)) [SIG API...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "Workload Identity, User Namespaces & Fine-Grained Authz",
              "models": "Multi-tenant SaaS workloads, zero-trust service meshes, and privileged container migrations",
              "gpus": "Linux kernel namespaces, kubelet endpoints, and CSI secret injection paths",
              "impact": "Reduces security agent/sidecar overhead and shrinks blast radius of container compromises"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Added support to the scheduler to start using QueueingHint registered for Pod/Updated event to determine whether unschedulable Pods update make them schedulable, when the feature gate `SchedulerQueueingHints` is enabled.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#122234"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Kubelet flag `--keep-terminated-pod-volumes` was removed.  This flag was deprecated in 2017. ([#122082](https://github.com/kubernetes/kubernetes/pull/122082), [@carlory](https://github.com/carlory)) [SIG Apps, Node, Stor",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#122082"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Reduced state change noise when volume expansion fails. Also mark certain failures as infeasible. ACTION REQUIRED:  If you are using the `RecoverVolumeExpansionFailure` alpha feature gate then after upgrading to this rel",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#126108"
              },
              {
                "change": "Deprecation",
                "impact": "'kubeadm: marked the sub-phase of ''init kubelet-finilize'' called ''experimental-cert-rotation'' as deprecated and print a warning if it is used directly; it will be removed in a future release. Add a replacement sub-ph",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#124419"
              },
              {
                "change": "Deprecation",
                "impact": "Added a warning when creating or updating a PersistentVolume (PV) with the deprecated annotation `volume.beta.kubernetes.io/mount-options`. ([#124819](https://github.com/kubernetes/kubernetes/pull/124819), [@carlory](htt",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#124819"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Feature",
              "hardware": "Graduated the `WatchList` feature gate to beta for kube-apiserver and enabled `WatchListClient` for kube-controller-manager (KCM). ([#125591](https://github.com",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#125591"
            },
            {
              "label": "API Change",
              "hardware": "Promoted `LocalStorageCapacityIsolation` to beta; the behaviour is enabled by default. Within the kubelet, storage capacity isolation is active if the feature g",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#126014"
            },
            {
              "label": "API Change",
              "hardware": "Graduated the `DisableNodeKubeProxyVersion` feature gate to beta. By default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for its",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123845"
            },
            {
              "label": "Feature",
              "hardware": "Promoted CRI communication of the cgroup driver mechanism to beta. The `KubeletCgroupDriverFromCRI` feature gate is now in beta and enabled by default. This all",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#125828"
            },
            {
              "label": "Deprecation",
              "hardware": "Kubeadm: deprecated the kubeadm `RootlessControlPlane` feature gate (previously alpha), given that the core K8s `UserNamespacesSupport` feature gate graduated t",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#124997"
            }
          ]
        }
      },
      {
        "version": "v1.30",
        "badge": "Release",
        "date": "2024-04-17",
        "stats": "254 upstream changes and 131 PRs",
        "headline": "API Change Enhancements, Feature Enhancements",
        "executive_summary": "Translating KUBERNETES v1.30 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#123575",
                "#123481",
                "#122589"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Change Enhancements.",
              "now": "Graduated pod scheduling gates to general availability. The `PodSchedulingReadiness` feature gate no longer has any effect, and the `.spec.schedulingGates` field is always...; Graduated support for `minDomains` in pod topology spread constraints, to general availability. The `MinDomainsInPodTopologySpread` feature gate no longer has any effect, and...; Contextual logging is now in beta and enabled by default. Check out the [KEP](https://github.com/kubernetes/enhancements/issues/3077) and [official...; Fixed accidental enablement of the new alpha `optionalOldSelf` API field in `CustomResourceDefinition` validation rules, which should only have been allowed to be set when the...; Aggregated discovery supports both `v2beta1` and v2 types and feature is promoted to GA. ([#122882](https://github.com/kubernetes/kubernetes/pull/122882),...",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#122870",
                "#123281",
                "#121461"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "Promoted the `status.hostIPs` field for Pods to general availability. The `PodHostIPs` feature gate no longer has any effect, and the `status.hostIPs` field is always available...; To disable RemoteCommand over WebSockets for kubectl, the environment variable feature gate must be explicitly set to `false`: `KUBECTL_REMOTE_COMMAND_WEBSOCKETS=false`....; Promoted the `CRDValidationRatcheting` feature gate to beta and made it enabled by default. ([#121461](https://github.com/kubernetes/kubernetes/pull/121461),...; In the Pod API, setting the alpha `procMount` field to `Unmasked` in a container now required setting `spec.hostUsers=false` as well....; kubectl `port-forward` over websockets (tunneling SPDY) can now be enabled using an `Alpha` feature flag environment variable: KUBECTL_PORT_FORWARD_WEBSOCKETS=true. The API...",
              "config_snippet": ""
            },
            {
              "title": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-2008",
                "#2008",
                "#123215",
                "#123366"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle.",
              "now": "Graduated \"Forensic Container Checkpointing\" (KEP #2008) from Alpha to Beta. ([#123215](https://github.com/kubernetes/kubernetes/pull/123215),...; Revised node selection based on container image location. The kube-scheduler now considers whether nodes have the required images available for init containers, and for sidecar...; In kubelet configuration, the `.memorySwap.swapBehavior` field now accepts a new value `NoSwap`, which becomes the default if unspecified. The previously accepted...; Added the `disable-force-detach` CLI option for `kube-controller-manager`. By default, it's set to `false`. When enabled, it prevents force detaching volumes based on maximum...; Node podresources API now includes init containers with containerRestartPolicy of `Always` when `SidecarContainers` feature is enabled....",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#122881",
                "#123341",
                "#122571"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Server & etcd Watch/Cache Efficiency at Scale.",
              "now": "Added a CBOR implementation of `runtime.Serializer`. Until CBOR graduates to Alpha, API servers will refuse to start if configured with CBOR support....; kubeadm: added the `WaitForAllControlPlaneComponents` feature gate. It could be used to tell kubeadm to wait for all control plane components to be ready when running \"kubeadm...; Added `WatchListClient` feature gate to `client-go`. When enabled, it allows the client to receive a stream of individual items instead of chunking from the server....; When the `RetryGenerateName` feature gate is enabled on the kube-apiserver, create requests using generateName are retried automatically by the apiserver when the generated...; Added the `apiserver_watch_cache_read_wait` metric to measure the watch cache impact on request latency. ([#123190](https://github.com/kubernetes/kubernetes/pull/123190),...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "models": "Service-mesh pods, telemetry agents, fast-restoring stateful apps, and OCI artifact mounts",
              "gpus": "Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes",
              "impact": "Stops zombie sidecars from holding batch nodes open after job completion"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            },
            {
              "term": "Linux User Namespaces (`hostUsers: false`)",
              "plain_english": "Maps the `root` user inside a container to an unprivileged non-root UID on the host node kernel.",
              "bottom_line": "Dramatically reduces container-escape blast radius even for legacy workloads that require running as `root` inside the container."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Deprecation",
                "impact": "kubectl: Removed the deprecated flag `prune-whitelist` for apply. Please use the flag `prune-allowlist` instead. ([#120246](https://github.com/kubernetes/kubernetes/pull/120246), [@pacoxu](https://github.com/pacoxu))",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#120246"
              },
              {
                "change": "Deprecation",
                "impact": "The deprecated `SecurityContextDeny` admission plugin, which has been deprecated since `v1.27`, has been removed. It is recommended to use the Pod Security Admission plugin instead, which has been available since v1.25. ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#122612"
              },
              {
                "change": "Feature",
                "impact": "To disable RemoteCommand over WebSockets for kubectl, the environment variable feature gate must be explicitly set to `false`: `KUBECTL_REMOTE_COMMAND_WEBSOCKETS=false`. ([#123281](https://github.com/kubernetes/kubernete",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#123281"
              },
              {
                "change": "API Change",
                "impact": "AppArmor profiles can now be configured through fields on the `PodSecurityContext` and container `SecurityContext`. The beta AppArmor annotations are deprecated, and AppArmor status is no longer included in the node read",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#123435"
              },
              {
                "change": "Feature",
                "impact": "kubectl `port-forward` over websockets (tunneling SPDY) can now be enabled using an `Alpha` feature flag environment variable: KUBECTL_PORT_FORWARD_WEBSOCKETS=true. The API Server being communicated to must *also* have a",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#123413"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "Graduated pod scheduling gates to general availability. The `PodSchedulingReadiness` feature gate no longer has any effect, and the `.spec.schedulingGates` fiel",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123575"
            },
            {
              "label": "API Change",
              "hardware": "Graduated support for `minDomains` in pod topology spread constraints, to general availability. The `MinDomainsInPodTopologySpread` feature gate no longer has a",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123481"
            },
            {
              "label": "API Change",
              "hardware": "Added a CBOR implementation of `runtime.Serializer`. Until CBOR graduates to Alpha, API servers will refuse to start if configured with CBOR support. ([#122881]",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#122881"
            },
            {
              "label": "Feature",
              "hardware": "Graduated \"Forensic Container Checkpointing\" (KEP #2008) from Alpha to Beta. ([#123215](https://github.com/kubernetes/kubernetes/pull/123215), [@adrianreber](ht",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2008"
            },
            {
              "label": "API Change",
              "hardware": "Promoted `AdmissionWebhookMatchConditions` to GA. The feature is now stable, and the feature gate is now locked to default. ([#123560](https://github.com/kubern",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123560"
            }
          ]
        }
      },
      {
        "version": "v1.29",
        "badge": "Release",
        "date": "2023-12-13",
        "stats": "302 upstream changes and 131 PRs",
        "headline": "Feature Enhancements, API Server & etcd Watch/Cache Efficiency at Scale",
        "executive_summary": "Translating KUBERNETES v1.29 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#120682",
                "#121485",
                "#121638"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "`kube-controller-manager`: The `LegacyServiceAccountTokenCleanUp` feature gate is now `beta` and enabled by default. When enabled, legacy auto-generated service account token...; The KMSv2 features with feature gates `KMSv2` and `KMSv2KDF` are promoted to `GA`.  The `KMSv1` feature gate is now disabled by default....; Priority and Fairness feature is now `stable`, the feature gate will be removed in `v1.31`. ([#121638](https://github.com/kubernetes/kubernetes/pull/121638),...; Changed the `KMSv2KDF` feature gate to be enabled by default. ([#120433](https://github.com/kubernetes/kubernetes/pull/120433), [@enj](https://github.com/enj)) [SIG API...; Graduated the `ReadWriteOncePod` feature gate to `GA`. ([#121077](https://github.com/kubernetes/kubernetes/pull/121077), [@chrishenzie](https://github.com/chrishenzie))",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#120228",
                "#120490",
                "#120154"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Server & etcd Watch/Cache Efficiency at Scale.",
              "now": "`kubeadm`: promoted feature gate `EtcdLearnerMode` to `beta`. Learner mode for joining `etcd` members is now enabled by default....; Added `apiserver_watch_list_duration_seconds` metrics which will measure response latency distribution in seconds for watchlist requests broken by group, version, resource and...; `kube-apiserver`: added `--authorization-config` flag for reading a configuration file containing an `apiserver.config.k8s.io/v1alpha1 AuthorizationConfiguration` object. The...; `PriorityLevelConfiguration`: the `.spec.limited.nominalConcurrencyShares` field defaults to `30` only if the field is omitted (v1beta3 also defaulted an explicit `0` value to...; Removed `/livez` livezchecks for KMS v1 and v2 to ensure KMS health does not cause `kube-apiserver` restart. KMS health checks are still in place as a healthz and readiness...",
              "config_snippet": ""
            },
            {
              "title": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#121254",
                "#117502",
                "#120534"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Dynamic Resource Allocation.",
              "now": "`DevicePluginCDIDevices` feature has been graduated to `beta` and enabled by default in the kubelet. ([#121254](https://github.com/kubernetes/kubernetes/pull/121254),...; Added `kubectl node drain` helper callbacks `OnPodDeletionOrEvictionStarted` and `OnPodDeletionOrEvictionFailed`; people extending `kubectl` can use these new callbacks for...; `dra`: the scheduler plugin now avoids additional scheduling attempts in some cases by falling back to SSA after a conflict....",
              "config_snippet": ""
            },
            {
              "title": "Networking, `nftables` Proxy & Traffic Observability",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#121046",
                "#119937",
                "#120275"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Networking, `nftables` Proxy & Traffic Observability.",
              "now": "`kube-proxy` now has a new nftables-based mode, available by running `kube-proxy --feature-gates NFTablesProxyMode=true --proxy-mode nftables` This is currently an alpha-level...; Added a new `ipMode` field to the `.status` of Services where `type` is set to `LoadBalancer`. The new field is behind the `LoadBalancerIPMode` feature gate....; The `CloudDualStackNodeIPs` feature is now `beta`, meaning that when using an external cloud provider that has been updated to support the feature, you can pass comma-separated...; Added a new `ServiceCIDR` type that allows to dynamically configure the cluster range used to allocate `Service ClusterIPs` addresses....; Fixed `kube-proxy` panicking on exit when the `Node` object changed its `PodCIDR`. ([#120375](https://github.com/kubernetes/kubernetes/pull/120375),...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "models": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
              "gpus": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
              "impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting"
            },
            {
              "persona": "Networking, `nftables` Proxy & Traffic Observability",
              "models": "High-throughput east-west microservices and latency-sensitive ingress traffic",
              "gpus": "Linux dataplane (`nftables`/`ipvs`) and cloud load balancers",
              "impact": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Stopped accepting component configuration for `kube-proxy` and `kubelet` during `kubeadm upgrade plan --config`. This was a legacy behavior that was not well supported for upgrades and could be used only at the plan stag",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#120788"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "`kubeadm`: a separate \"super-admin.conf\" file is now deployed. The User in `admin.conf` is now bound to a new RBAC Group `kubeadm:cluster-admins` that has `cluster-admin` `ClusterRole` access. The User in `super-admin.co",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#121305"
              },
              {
                "change": "Deprecation",
                "impact": "#### Additional documentation e.g., KEPs (Kubernetes Enhancement Proposals), usage docs, etc.: <!-- This section can be blank if this pull request does not require a release note. When adding links which point to resourc",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.29"
              },
              {
                "change": "Deprecation",
                "impact": "[KEP]: <link>",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.29"
              },
              {
                "change": "Deprecation",
                "impact": "[Usage]: <link>",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.29"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "Added `UserNamespacesPodSecurityStandards` feature gate to enable user namespace support for Pod Security Standards. Enabling this feature will modify all Pod S",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#118760"
            },
            {
              "label": "Feature",
              "hardware": "Added new feature gate called `RuntimeClassInImageCriApi` to address `kubelet` changes needed for KEP 4216. Noteable changes: 1. Populate new `RuntimeHandler` f",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#121456"
            },
            {
              "label": "Feature",
              "hardware": "`kube-controller-manager`: The `LegacyServiceAccountTokenCleanUp` feature gate is now `beta` and enabled by default. When enabled, legacy auto-generated service",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#120682"
            },
            {
              "label": "Feature",
              "hardware": "Priority and Fairness feature is now `stable`, the feature gate will be removed in `v1.31`. ([#121638](https://github.com/kubernetes/kubernetes/pull/121638), [@",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#121638"
            },
            {
              "label": "API Change",
              "hardware": "`PersistentVolumeLastPhaseTransitionTime` is now beta and enabled by default. ([#120627](https://github.com/kubernetes/kubernetes/pull/120627), [@RomanBednar](h",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#120627"
            }
          ]
        }
      },
      {
        "version": "v1.28",
        "badge": "Release",
        "date": "2023-08-15",
        "stats": "305 upstream changes and 148 PRs",
        "headline": "Feature Enhancements, Networking, `nftables` Proxy & Traffic Observability",
        "executive_summary": "Translating KUBERNETES v1.28 implementation changes into adoption decisions for people who don't follow container-orchestration engineering full-time \u2014 what changed, and what it means for the workloads you run, the nodes/GPUs you manage, and your cluster bill.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#116741",
                "#118763",
                "#119328"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Feature Enhancements.",
              "now": "The `ExpandedDNSConfig` feature has graduated to GA. 'ExpandedDNSConfig' feature was locked to default value and will be removed in v1.30. If you were setting this feature gate...; The `AdvancedAuditing` feature gate that graduated to GA in `v1.12` (and was unconditionally enabled) has been removed....; Added a new feature gate, `SchedulerQueueingHints` (enabled by default). The new feature gate activates a framework for fine-grained filtering of events related to scheduler...; Graduated the `LegacyServiceAccountTokenTracking` feature gate to GA. The usage of auto-generated secret-based service account token now produces warnings, and relevant Secrets...; Graduated the `ProbeTerminationGracePeriod` feature gate to GA. ([#114307](https://github.com/kubernetes/kubernetes/pull/114307), [@rphillips](https://github.com/rphillips))",
              "config_snippet": ""
            },
            {
              "title": "Networking, `nftables` Proxy & Traffic Observability",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-3178",
                "#119374",
                "#118895",
                "#117800"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in Networking, `nftables` Proxy & Traffic Observability.",
              "now": "The `IPTablesOwnershipCleanup` feature (KEP-3178) is now GA; kubelet no longer creates the `KUBE-MARK-DROP` chain (which has been unused for several releases) or the...; Added `IP mode` field to loadbalancer status ingress. ([#118895](https://github.com/kubernetes/kubernetes/pull/118895), [@RyanAoh](https://github.com/RyanAoh)); Kube-proxy: added `--logging-format` flag to support structured logging. ([#117800](https://github.com/kubernetes/kubernetes/pull/117800),...; Kube-proxy handles Terminating EndpointSlices conditions and enables zero downtime deployments for Services with ExternalTrafficPolicy=Local author: @andrewsykim...; Kube-proxy service health returns http header `X-Load-Balancing-Endpoint-Weight` with number of local endpoints. The same information is still available in response body JSON...",
              "config_snippet": ""
            },
            {
              "title": "CEL-Based Validating & Mutating Admission Policies",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#119380",
                "#118644",
                "#119215"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in CEL-Based Validating & Mutating Admission Policies.",
              "now": "Graduated `AdmissionWebhookMatchCondition` feature to beta. ([#119380](https://github.com/kubernetes/kubernetes/pull/119380), [@a-hilaly](https://github.com/a-hilaly)); Promoted API groups `ValidatingAdmissionPolicy` and `ValidatingAdmissionPolicyBinding` to `v1beta1`. ([#118644](https://github.com/kubernetes/kubernetes/pull/118644),...; Added a new `namespaceParamRef` field to `admissionregistration.k8s.io/v1alpha1.ValidatingAdmissionPolicy`. ([#119215](https://github.com/kubernetes/kubernetes/pull/119215),...; Added namespace access support to the CEL expressions of ValidatingAdmissionPolicy via a `namespaceObject` variable with expressions....; A ValidatingAdmissionPolicy now has its `messageExpression` field checked against resolved types. ([#119209](https://github.com/kubernetes/kubernetes/pull/119209),...",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#117570",
                "#115554",
                "#117713"
              ],
              "before": "Earlier releases required separate workarounds or lacked native kernel/runtime support in API Change Enhancements.",
              "now": "Removed `WindowsHostProcessContainers` feature-gate. ([#117570](https://github.com/kubernetes/kubernetes/pull/117570), [@marosset](https://github.com/marosset)) [SIG API...; `kube-controller-manager`: The `LegacyServiceAccountTokenCleanUp` feature gate is now available as alpha (off by default). When enabled, the...; The `SelfSubjectReview` API is promoted to `authentication.k8s.io/v1` and the `kubectl auth whoami` command is GA....; Added new `CRDValidationRatcheting` alpha feature. During a PATCH or UPDATE Validation Ratcheting discards errors thrown by unchanged portions of the resource from most OpenAPI...; Changed how KMS v2 encryption at rest can generate data encryption keys. When you enable the `KMSv2KDF` feature gate (off by default), KMS v2 uses a key derivation function to...",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Networking, `nftables` Proxy & Traffic Observability",
              "models": "High-throughput east-west microservices and latency-sensitive ingress traffic",
              "gpus": "Linux dataplane (`nftables`/`ipvs`) and cloud load balancers",
              "impact": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules"
            },
            {
              "persona": "CEL-Based Validating & Mutating Admission Policies",
              "models": "Platform security guardrails, multi-tenant compliance policies, and default resource injectors",
              "gpus": "In-process `kube-apiserver` admission chain (replaces external webhook deployments)",
              "impact": "Removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Action required for the custom scheduler plugin developers. Here's the breaking change in `EnqueueExtension` in the scheduling framework. The `EventsToRegister` in `EnqueueExtension` changed the return value from `Cluste",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.28"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "if more than one QueueingHintFn returns QueueImmediately, it queues Pod to activeQ.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.28"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "If no QueueingHintFn returns QueueImmediately and more than one plugin returns QueueAfterBackoff, it queues Pod to backoffQ if Pod is backing off, or to activeQ if Pod's backoff has already finished.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.28"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "If all QueueingHintFn return QueueSkip, it puts this pod back to the unschedulable pod pool Having appropriate QueueingHintFn contributes to reducing useless retries and thus improves the overall scheduler's performance.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#118551"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "CephFS volume plugin (`kubernetes.io/cephfs`) has been deprecated in this release and will be removed in a subsequent release. The alternative is to use the CephFS CSI driver (https://github.com/ceph/ceph-csi/) in your K",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#118143"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Feature",
              "hardware": "The `ExpandedDNSConfig` feature has graduated to GA. 'ExpandedDNSConfig' feature was locked to default value and will be removed in v1.30. If you were setting t",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#116741"
            },
            {
              "label": "Feature",
              "hardware": "The `AdvancedAuditing` feature gate that graduated to GA in `v1.12` (and was unconditionally enabled) has been removed. ([#118763](https://github.com/kubernetes",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#118763"
            },
            {
              "label": "API Change",
              "hardware": "The `IPTablesOwnershipCleanup` feature (KEP-3178) is now GA; kubelet no longer creates the `KUBE-MARK-DROP` chain (which has been unused for several releases) o",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#119374"
            },
            {
              "label": "API Change",
              "hardware": "Graduated `AdmissionWebhookMatchCondition` feature to beta. ([#119380](https://github.com/kubernetes/kubernetes/pull/119380), [@a-hilaly](https://github.com/a-h",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#119380"
            },
            {
              "label": "Feature",
              "hardware": "Graduated the `LegacyServiceAccountTokenTracking` feature gate to GA. The usage of auto-generated secret-based service account token now produces warnings, and ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#117591"
            }
          ]
        }
      }
    ],
    "weekly_editions": [
      {
        "id": "2026-11-01",
        "date_iso": "2026-11-01",
        "label": "2026-11-01 (Latest)",
        "date_range": "Week Ending November 01, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-11-01): 143644: Update volume health APIs as per newest version of KEP",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Control Plane Efficiency",
            "title": "Decoding JSON into UnstructuredList Now Uses 50% Less RAM & 33% Less CPU Time",
            "summary": "A major optimization in client/server JSON decoding cuts memory allocations in half when listing Custom Resources (CRDs) and dynamic objects.",
            "impact": "Directly lowers memory spikes in Argo CD, Flux, Kyverno, and custom operators watching large CRD fleets.",
            "prs": [
              "#142575"
            ]
          },
          {
            "tag": "Upgrade Alert",
            "title": "Locked GA `SupplementalGroupsPolicy` Feature Gate Removed + Kubernetes 1.34 Reaches EOL",
            "summary": "The graduated `SupplementalGroupsPolicy` gate has been removed from component flags, and Kubernetes 1.34 officially reached End of Life alongside patch releases 1.37.2, 1.36.6, and 1.35.10.",
            "impact": "Remove `--feature-gates=SupplementalGroupsPolicy=...` from your API server/kubelet manifests before upgrading.",
            "prs": [
              "#142093"
            ]
          },
          {
            "tag": "Storage & StatefulSets",
            "title": "StatefulSet `maxUnavailable` Partition Fix & CSI Controller Node Info (KEP-6011)",
            "summary": "StatefulSet rolling updates no longer count unavailable pods below the partition against your `maxUnavailable` budget, and KEP-6011 moves CSI cloud topology queries off worker nodes.",
            "impact": "Safer canary rollouts for databases and no more cloud IAM credentials needed on worker nodes for CSI volume limits.",
            "prs": [
              "#143114",
              "#143644"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "143644: Update volume health APIs as per newest version of KEP",
                "pr": "#143644",
                "what_it_is": "gnufied updated Kubernetes volume health APIs to align with the latest design in KEP-1432, with related changes discussed in KEP-6395. The change moves `volumeHealth` from `PodStatus` into `PodStatus.VolumeStatus` and introduces `Healthy` and `Unknown` values for volume health conditions in the core API and `CSINode` types. It also clarifies how readers and writers should handle new condition values, helping maintain compatibility as volume health reporting evolves. These API changes establish a clearer contract for reporting storage health across Kubernetes and CSI drivers.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "143701: KEP-5502: Run EmptyDirVolumeMode e2e tests in alpha/beta kind jobs",
                "pr": "#143701",
                "what_it_is": "blackjid fixed the test selection for `EmptyDirVolumeMode` end-to-end tests so they can run in the alpha/beta Kind jobs. The tests were being excluded because the additional `[Feature:EmptyDirVolumeMode]` label conflicted with the jobs' `OffByDefault` feature filter, and no other job selected them. This change removes the redundant label while retaining `framework.WithFeatureGate(...)`, allowing the tests to run in CI and build a test history ahead of the feature's beta promotion. The work supports KEP-5502.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "cel-go upgraded to v0.33.0 (#143439), now imported as cel.dev/cel-go; Go code passing cel-go types to k8s.io/apiserver, apiextensions-apiserver or dynamic-resource-allocation must update imports",
              "CRD types and clients move to the new k8s.io/apiextensions-api module (#142746), with deprecated aliases left in apiextensions-apiserver",
              "kube-apiserver adds conditional authorization support (#141959)",
              "client-go leader election adds write-gating and leader recovery (#143289)",
              "The locked GA SupplementalGroupsPolicy feature gate is removed (#142093); remove it from component configuration before upgrading",
              "StatefulSet maxUnavailable no longer counts unavailable pods below the partition (#143114) against the update budget",
              "Decoding JSON lists into UnstructuredList uses about half the memory (#142575) and a third less time",
              "New WatchFromStorageWithoutPrevKV feature gate (#131862) enables etcd watches without prev-kv"
            ]
          }
        ]
      },
      {
        "id": "2026-10-25",
        "date_iso": "2026-10-25",
        "label": "2026-10-25",
        "date_range": "Week Ending October 25, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-25): 143463: KEP-5710: Log error when PostFilter plugin does not implement PodGroupPostFilterPlugin",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "143463: KEP-5710: Log error when PostFilter plugin does not implement PodGroupPostFilterPlugin",
            "summary": "jdzikowski added a scheduler initialization check for plugins that implement `PostFilter` but not `PodGroupPostFilterPlugin`, as part of KEP-5710. With the `GenericWorkload` feature gate enabled, the scheduler now logs an error when an enabled plugin will be skipped during scheduling for a PodGroup or CompositePodGroup. Previously, this behavior could go unnoticed, potentially leaving workload-aware scheduling integrations without the expected post-filtering behavior. The check also fulfills one of the KEP's graduation criteria for General Availability.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#143463"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "143463: KEP-5710: Log error when PostFilter plugin does not implement PodGroupPostFilterPlugin",
                "pr": "#143463",
                "what_it_is": "jdzikowski added a scheduler initialization check for plugins that implement `PostFilter` but not `PodGroupPostFilterPlugin`, as part of KEP-5710. With the `GenericWorkload` feature gate enabled, the scheduler now logs an error when an enabled plugin will be skipped during scheduling for a PodGroup or CompositePodGroup. Previously, this behavior could go unnoticed, potentially leaving workload-aware scheduling integrations without the expected post-filtering behavior. The check also fulfills one of the KEP's graduation criteria for General Availability.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "143387: KEP-5491: Adds integration and e2e test for List Type Attributes",
                "pr": "#143387",
                "what_it_is": "everpeace added integration and end-to-end tests for list-typed `matchAttribute` and `distinctAttribute` constraints in Dynamic Resource Allocation (DRA), as specified by KEP-5491. The tests exercise allocation against a real API server and scheduler, covering intersecting and disjoint attribute lists, scalar-to-list matching, and distinctness constraints. These cases help verify that device allocation behaves correctly across different attribute combinations and provide coverage required by the KEP's test plan for beta promotion in Kubernetes v1.38.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Fix for a kubelet bug (#141014) that set pod sandbox CPU and memory limits to the partial sum of container limits when only some containers declared them",
              "kube-scheduler's preemption disruption metric gains a victim label (#142955); PreemptionVictim gains a Type() method and PreemptionCandidate.NumPodGroupDisruptions() is replaced by NumDisruptionsByVictimType()",
              "MutatingAdmissionWebhook config gains a staticOrder field (#143160) to control manifest vs. API-registered webhook ordering; requires the ManifestBasedAdmissionControlConfig gate and must be removed before downgrading to v1.37 or earlier",
              "A new evictionrequest-controller (#137133) creates Evictions from EvictionRequests and coordinates external responders",
              "Add cgroup_mount_mode to the CRI API (#139824) to support writable cgroups",
              "kubectl selector commands like create pdb --selector (#142216) now accept !=",
              "client-go adds DropManagedFields (#142695) to omit managedFields from API responses, behind the new alpha ManagedFieldsOptOutClient gate",
              "kubelet adds the alpha kubelet_device_plugin_devices (#143223) metric, breaking device counts down by health state"
            ]
          }
        ]
      },
      {
        "id": "2026-10-18",
        "date_iso": "2026-10-18",
        "label": "2026-10-18",
        "date_range": "Week Ending October 18, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-18): [143188: [WAS] KEP-5547: Promote Job Scheduling feature gate to Beta](https://github.com/kubernetes/kubernetes/pull/143188)",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "[143188: [WAS] KEP-5547: Promote Job Scheduling feature gate to Beta](https://github.com/kubernetes/kubernetes/pull/143188)",
            "summary": "helayoty promoted the `WorkloadWithJob` feature gate to Beta as part of KEP-5547. This integrates Workload-aware Scheduling (WAS) APIs into the Kubernetes Job controller, allowing Jobs to express scheduling intent through `spec.scheduling`\u2060, including gang scheduling and topology constraints. The controller translates this configuration into `Workload` and `PodGroup` objects, enabling related Pods to be scheduled according to the workload's requirements. The feature remains disabled by default in this promotion, giving clusters control over when to enable the integration.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#143188"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "[143188: [WAS] KEP-5547: Promote Job Scheduling feature gate to Beta](https://github.com/kubernetes/kubernetes/pull/143188)",
                "pr": "#143188",
                "what_it_is": "helayoty promoted the `WorkloadWithJob` feature gate to Beta as part of KEP-5547. This integrates Workload-aware Scheduling (WAS) APIs into the Kubernetes Job controller, allowing Jobs to express scheduling intent through `spec.scheduling`\u2060, including gang scheduling and topology constraints. The controller translates this configuration into `Workload` and `PodGroup` objects, enabling related Pods to be scheduled according to the workload's requirements. The feature remains disabled by default in this promotion, giving clusters control over when to enable the integration.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "143160: KEP-5793: Add staticOrder to control mutating webhook merge order",
                "pr": "#143160",
                "what_it_is": "aramase added the `staticOrder` field to `WebhookAdmissionConfiguration` as part of KEP-5793. Previously, manifest-based mutating admission webhooks always ran before webhooks registered through the API, so migrating a webhook to a manifest could change the order in which mutations were applied. The new configuration supports three ordering modes: `StaticFirst` to preserve the existing behavior, `StaticLast` to run manifest-based webhooks afterward, and `ByName` to sort both sets together by configuration name. This gives cluster administrators more control over admission ordering when using manifest-based admission control, while caching the merged webhook list avoids adding per-request processing overhead.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Go API objects no longer provides direct access to the Raw byte slice (#143011) in `ObjectMeta.ManagedFields[*].FieldsV1`",
              "kube-apiserver: support the ShardedListAndWatch feature for custom resources and dynamic clients that use Unstructured objects (#142975)",
              "Job controller: `job_pods_creation_total` no longer counts a failed pod creation as both succeeded and failed (#142923)",
              "Job status.ready no longer decreases when deleting a Ready pod fails (#142922)",
              "Fixed differences between continue token generated by cacher and etcd3 (#142919)",
              "Fixed deployment rollouts failing to report timeouts after old ReplicaSet scale-down errors (#142902)",
              "The `KUBECTL_REMOTE_COMMAND_WEBSOCKETS` and `KUBECTL_PORT_FORWARD_WEBSOCKETS` environment variables are removed (#142861); the features are GA",
              "Increased PodGroup priority validation to highest possible value that can be set (#142846)"
            ]
          }
        ]
      },
      {
        "id": "2026-10-11",
        "date_iso": "2026-10-11",
        "label": "2026-10-11",
        "date_range": "Week Ending October 11, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-11): [142913: [KEP-4443] Add more granular job failure condition reasons](https://github.com/kubernetes/kubernetes/pull/142913)",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "[142913: [KEP-4443] Add more granular job failure condition reasons](https://github.com/kubernetes/kubernetes/pull/142913)",
            "summary": "ameukam added more granular failure condition reasons for Jobs using `PodFailurePolicy`. Previously, multiple rules using the `FailJob` action could produce the same generic failure reason, making it difficult for higher-level controllers to determine why a Job failed. This change allows rules to be named so that the resulting Job failure condition can identify the rule responsible, falling back to the rule's index when no name is specified. This gives controllers such as JobSet more precise information to make decisions about retries and recovery. The change is part of KEP-4443.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#142913"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "[142913: [KEP-4443] Add more granular job failure condition reasons](https://github.com/kubernetes/kubernetes/pull/142913)",
                "pr": "#142913",
                "what_it_is": "ameukam added more granular failure condition reasons for Jobs using `PodFailurePolicy`. Previously, multiple rules using the `FailJob` action could produce the same generic failure reason, making it difficult for higher-level controllers to determine why a Job failed. This change allows rules to be named so that the resulting Job failure condition can identify the rule responsible, falling back to the rule's index when no name is specified. This gives controllers such as JobSet more precise information to make decisions about retries and recovery. The change is part of KEP-4443.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "142898: e2e: test KEP-4006 WebSocket exec, attach and port-forward without SPDY fallback",
                "pr": "#142898",
                "what_it_is": "seans3 added end-to-end tests for `exec`, `attach`, and `port-forward` over WebSockets without allowing a fallback to SPDY. Tests that permit fallback can pass even when the WebSocket path is broken, leaving gaps in coverage for Kubernetes' transition away from SPDY. By explicitly exercising these operations without fallback, this change helps verify that WebSocket streaming works independently and provides stronger confidence in the new protocol paths. The work is part of KEP-4006, with promotion of the tests to conformance planned as a follow-up after a soak period.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "142897: apiserver, kubelet: graduate the KEP-4006 WebSocket streaming metrics to BETA",
                "pr": "#142897",
                "what_it_is": "seans3 graduated WebSocket streaming metrics in the API server and kubelet from Alpha to Beta as part of KEP-4006. The metrics provide visibility into WebSocket streaming requests handled by the API server and kubelet, including requests processed through the API server's stream translator and tunnel. Advancing these metrics to Beta improves their stability and makes them more useful for monitoring and troubleshooting as Kubernetes continues its transition from SPDY to WebSockets.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "kubectl kustomize no longer loads kustomize Go (`.so`) plugins (#142791); exec and KRM function plugins are unaffected",
              "Updated TokenReview internal type to improve cast speed from latest external version (#142750)",
              "Strengthened runtime PodGroup and CompositePodGroup hierarchy validation in kube-scheduler (#142719) to verify maximum tree depth, Workload reference consistency, scheduling policies, and disruption modes",
              "applyconfiguration-gen now honors `+k8s:openapi-model-package` when looking up OpenAPI definitions (#142697), and fails if the schema has no definition for a root type",
              "kube-apiserver and other servers built on k8s.io/apiserver now accept up to 16384 request header values (#142607)",
              "API server now returns 400 instead of 500 status code (#142591) on GET request with invalid revision",
              "Fixed API warnings on ReplicationController updates (#142443), which described the previous pod template instead of the new one",
              "DRA consumable capacity + CEL: fixed name comparisons and lookup (#142202)"
            ]
          }
        ]
      },
      {
        "id": "2026-10-04",
        "date_iso": "2026-10-04",
        "label": "2026-10-04",
        "date_range": "Week Ending October 04, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-04): 142693: Add CSIControllerGetNodeInfo feature gate and driverRegistrations field",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "142693: Add CSIControllerGetNodeInfo feature gate and driverRegistrations field",
            "summary": "torredil added the alpha `CSIControllerGetNodeInfo` feature gate and the `driverRegistrations` field to `CSINode` as part of KEP-6011. The change enables CSI node registration to split node-side identity reporting from controller-side discovery of topology and volume attachment limits. This allows CSI drivers to obtain information that may require cloud API access from the controller rather than requiring those credentials on worker nodes. The controller-side flow also enables more accurate volume capacity tracking using `VolumeAttachment` information while preserving the existing node-side registration flow for drivers that do not opt in.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#142693"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "142693: Add CSIControllerGetNodeInfo feature gate and driverRegistrations field",
                "pr": "#142693",
                "what_it_is": "torredil added the alpha `CSIControllerGetNodeInfo` feature gate and the `driverRegistrations` field to `CSINode` as part of KEP-6011. The change enables CSI node registration to split node-side identity reporting from controller-side discovery of topology and volume attachment limits. This allows CSI drivers to obtain information that may require cloud API access from the controller rather than requiring those credentials on worker nodes. The controller-side flow also enables more accurate volume capacity tracking using `VolumeAttachment` information while preserving the existing node-side registration flow for drivers that do not opt in.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "[142789: KEP-[6283]: use kubernetes.io/kube-apiserver-serving CTB to mount kube-apiserver trust](https://github.com/kubernetes/kubernetes/pull/142789)",
                "pr": "#142789",
                "what_it_is": "stlaz introduced a feature gate, as part of KEP-6283, to switch ServiceAccount token volume trust from the `kube-root-ca.crt` ConfigMap to the `kubernetes.io/kube-apiserver-serving` ClusterTrustBundle. This provides a newer mechanism for making the kube-apiserver serving CA available to workloads using automatically mounted ServiceAccount token volumes, while allowing the existing behavior to remain available behind the feature gate.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Fixed refcounting leak in the node authorizer graph (#142574) for pods which reference secrets, configmaps, or pvcs multiple times",
              "Fixed `kubectl kuberc set` leaving a stale credential plugin allowlist (#142564) when the policy is changed to AllowAll or DenyAll, which caused kubectl to fail",
              "Added consistency store to client-go (#142537) and deprecated it from pkg/controller",
              "Fixed k8s.io/apimachinery/pkg/util/yaml silently dropping the last line of a YAML stream (#142527) when it has no trailing newline and its length is an exact multiple of the reader buffer size",
              "Separated deleteGet and updateGet etcd operation in etcd_request_* metrics (#142484) and added reason label to error",
              "kubelet: the pods API gRPC server now limits concurrent streams per connection to 100 (#142458) and applies its request rate limit to WatchPods stream openings",
              "kubelet: gRPC probes fail immediately when the connection is refused (#142457) instead of retrying until the probe timeout",
              "`kubectl label` now prints messages about nonexistent labels to stderr instead of stdout (#142436), so they no longer break JSON or YAML output"
            ]
          }
        ]
      }
    ]
  }
};
