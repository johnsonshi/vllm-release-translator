window.__PUBLICATION_DATA__ = {
  "vllm": {
    "brand": "vLLM Pulse",
    "tagline": "What changed in vLLM \u2014 and what it means for the models you serve, the GPUs you own, and your inference bill.",
    "weekly": {
      "id": "this-week-in-vllm",
      "issue_number": "Issue #47",
      "date_range": "Week Ending November 19, 2026",
      "reading_time": "4 min read",
      "headline": "This Week in vLLM: Hopper Humming MoE Kernels, Specialized Drafters for Kimi-K3.1, and Faster Multimodal Encoder Scheduling",
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
      ]
    },
    "releases": [
      {
        "version": "v0.34.0",
        "badge": "Latest Release",
        "date": "November 16, 2026",
        "stats": "1,061 commits \u00b7 412 contributors \u00b7 10 new models",
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
        "date": "November 2, 2026",
        "stats": "840+ commits \u00b7 DeepSeek-V4.1-Flash & K2-Horizon",
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
        "date": "October 18, 2026",
        "stats": "760+ commits \u00b7 Hy4-Preview (770B MoE) & Qwen3.8-Flash-Next",
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
        "badge": "Archive Release",
        "date": "2026-10-05",
        "stats": "56 upstream changes \u00b7 510 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Model Runner V2",
        "executive_summary": "Translating VLLM v0.31.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
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
              "before": "Prior to v0.31.0, teams operating frontier moe & sparse-mla speedups (deepseek-v4, glm-5.3, kimi-k3, minimax-m3) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.31.0, teams operating model runner v2 (mrv2) consolidation & breakable cuda graphs relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.31.0, teams operating low-precision quantization kernels (nvfp4, mxfp4, mxfp8, fp8 & humming) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.31.0, teams operating next-gen speculative decoding (eagle3, dspark, dflash, mtp & suffix) relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2026-09-22",
        "stats": "58 upstream changes \u00b7 561 PRs",
        "headline": "Low-Precision Quantization Kernels, Frontier MoE & Sparse-MLA Speedups",
        "executive_summary": "Translating VLLM v0.30.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
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
              "before": "Prior to v0.30.0, teams operating low-precision quantization kernels (nvfp4, mxfp4, mxfp8, fp8 & humming) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.30.0, teams operating frontier moe & sparse-mla speedups (deepseek-v4, glm-5.3, kimi-k3, minimax-m3) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.30.0, teams operating multi-vendor accelerator scaling (amd rocm 10 / mi355x, tpu & xpu) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.30.0, teams operating model runner v2 (mrv2) consolidation & breakable cuda graphs relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2026-09-09",
        "stats": "50 upstream changes \u00b7 337 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels",
        "executive_summary": "Translating VLLM v0.29.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
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
              "before": "Prior to v0.29.0, teams operating frontier moe & sparse-mla speedups (deepseek-v4, glm-5.3, kimi-k3, minimax-m3) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.29.0, teams operating low-precision quantization kernels (nvfp4, mxfp4, mxfp8, fp8 & humming) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.29.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.29.0, teams operating breaking changes & deprecations enhancements relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2026-08-26",
        "stats": "48 upstream changes \u00b7 190 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Next-Gen Speculative Decoding",
        "executive_summary": "Translating VLLM v0.28.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
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
              "before": "Prior to v0.28.0, teams operating frontier moe & sparse-mla speedups (deepseek-v4, glm-5.3, kimi-k3, minimax-m3) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.28.0, teams operating next-gen speculative decoding (eagle3, dspark, dflash, mtp & suffix) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.28.0, teams operating low-precision quantization kernels (nvfp4, mxfp4, mxfp8, fp8 & humming) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.28.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2026-08-10",
        "stats": "42 upstream changes \u00b7 223 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels",
        "executive_summary": "Translating VLLM v0.27.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
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
              "before": "Prior to v0.27.0, teams operating frontier moe & sparse-mla speedups (deepseek-v4, glm-5.3, kimi-k3, minimax-m3) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.27.0, teams operating low-precision quantization kernels (nvfp4, mxfp4, mxfp8, fp8 & humming) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.27.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.27.0, teams operating next-gen speculative decoding (eagle3, dspark, dflash, mtp & suffix) relied on manual configuration or older execution paths.",
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
        "date": "July 27, 2026",
        "stats": "411 commits \u00b7 212 contributors \u00b7 Tiered KV Offloading",
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
        "badge": "Archive Release",
        "date": "2026-07-11",
        "stats": "49 upstream changes \u00b7 204 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels",
        "executive_summary": "Translating VLLM v0.25.0 implementation changes into adoption decisions for people who don't follow inference engineering full-time \u2014 what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.",
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
              "before": "Prior to v0.25.0, teams operating frontier moe & sparse-mla speedups (deepseek-v4, glm-5.3, kimi-k3, minimax-m3) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.25.0, teams operating low-precision quantization kernels (nvfp4, mxfp4, mxfp8, fp8 & humming) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.25.0, teams operating model runner v2 (mrv2) consolidation & breakable cuda graphs relied on manual configuration or older execution paths.",
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
              "before": "Prior to v0.25.0, teams operating next-gen speculative decoding (eagle3, dspark, dflash, mtp & suffix) relied on manual configuration or older execution paths.",
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
      }
    ]
  },
  "kubernetes": {
    "brand": "KubePulse",
    "tagline": "What changed in Kubernetes \u2014 translated from KEPs and changelogs into plain-English upgrade and platform decisions.",
    "weekly": {
      "id": "this-week-in-kubernetes",
      "issue_number": "LWKD Edition",
      "date_range": "Week Ending November 1, 2026",
      "reading_time": "4 min read",
      "headline": "Last Week in Kubernetes: 50% Lower UnstructuredList Memory, Conditional Authorization, and Patch Releases 1.37.2 / 1.36.6",
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
        "date": "August 26, 2026",
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
        "badge": "Archive Release",
        "date": "2026-04-22",
        "stats": "347 upstream changes \u00b7 187 PRs",
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
              "before": "Prior to v1.36, teams operating dynamic resource allocation (dra) & gpu/accelerator management relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.36, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.36, teams operating workload-aware & gang scheduling (`podgroup` / `job` / queueing) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.36, teams operating api change enhancements relied on manual configuration or older execution paths.",
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
        "date": "December 17, 2025",
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
        "date": "August 27, 2025",
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
        "badge": "Archive Release",
        "date": "2025-04-23",
        "stats": "261 upstream changes \u00b7 151 PRs",
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
              "before": "Prior to v1.33, teams operating native sidecar containers, checkpoint/restore & node lifecycle relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.33, teams operating api server & etcd watch/cache efficiency at scale relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.33, teams operating in-place pod vertical scaling (zero-restart resource resize) relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.33, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2024-12-11",
        "stats": "298 upstream changes \u00b7 135 PRs",
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
              "before": "Prior to v1.32, teams operating dynamic resource allocation (dra) & gpu/accelerator management relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.32, teams operating api server & etcd watch/cache efficiency at scale relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.32, teams operating api change enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.32, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2024-08-13",
        "stats": "333 upstream changes \u00b7 164 PRs",
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
              "before": "Prior to v1.31, teams operating api server & etcd watch/cache efficiency at scale relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.31, teams operating workload identity, user namespaces & fine-grained authz relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.31, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.31, teams operating api change enhancements relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2024-04-17",
        "stats": "254 upstream changes \u00b7 131 PRs",
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
              "before": "Prior to v1.30, teams operating api change enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.30, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.30, teams operating native sidecar containers, checkpoint/restore & node lifecycle relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.30, teams operating api server & etcd watch/cache efficiency at scale relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2023-12-13",
        "stats": "302 upstream changes \u00b7 131 PRs",
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
              "before": "Prior to v1.29, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.29, teams operating api server & etcd watch/cache efficiency at scale relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.29, teams operating dynamic resource allocation (dra) & gpu/accelerator management relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.29, teams operating networking, `nftables` proxy & traffic observability relied on manual configuration or older execution paths.",
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
        "badge": "Archive Release",
        "date": "2023-08-15",
        "stats": "305 upstream changes \u00b7 148 PRs",
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
              "before": "Prior to v1.28, teams operating feature enhancements relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.28, teams operating networking, `nftables` proxy & traffic observability relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.28, teams operating cel-based validating & mutating admission policies relied on manual configuration or older execution paths.",
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
              "before": "Prior to v1.28, teams operating api change enhancements relied on manual configuration or older execution paths.",
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
    ]
  }
};
