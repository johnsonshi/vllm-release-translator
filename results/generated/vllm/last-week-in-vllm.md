# What's New in VLLM Last Week in VLLM (Week Ending 2026-11-19): The Adoption Decision Guide

> **Positioning**: *Translating VLLM Last Week in VLLM (Week Ending 2026-11-19) implementation changes into adoption decisions for people who don't follow inference engineering full-time — what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.*

**Release Snapshot**: `100` upstream changes analyzed | `8` capability themes | `8` upgrade/deprecation notices | `10` quantified performance proofs

---

## 1. What's the Big Deal?

Instead of reading hundreds of isolated PR descriptions, here are the most consequential architectural shifts in this release and why they matter operationally:

1. **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** ([#68429](https://github.com/vllm-project/vllm/pull/68429), [#68153](https://github.com/vllm-project/vllm/pull/68153), [#68345](https://github.com/vllm-project/vllm/pull/68345), [#68296](https://github.com/vllm-project/vllm/pull/68296)) — Key gates/APIs: `cache`
   - **What changed**: [Feature][Multimodal] Name every uncached item in the cache-miss error (@danielquintas8, #68429); [Spec Decode] Pass multimodal embeddings to NemotronH MTP (@anhtra3889, #68153); [Model Loader] Direct reload reruns post-load processing on the cold-start modules (LoRA) (@aoshen02, #68345); [Model] Add HY4 Flash and multimodal support (@jeejeelee, #68296); [Bugfix][Multimodal] Fix Qwen3-VL M-RoPE input positions after a pruned video (@jiahansu, #68270)
   - **Why it matters**: Directly benefits **Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters** on **Standard single-node and multi-node GPU inference pools** — **Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet**.
2. **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** ([#68568](https://github.com/vllm-project/vllm/pull/68568), [#68694](https://github.com/vllm-project/vllm/pull/68694), [#68652](https://github.com/vllm-project/vllm/pull/68652), [#68574](https://github.com/vllm-project/vllm/pull/68574)) — Key gates/APIs: `mi300_dpx`, `mi300_1`
   - **What changed**: [ROCm][CI] Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily (@sheralskumar, #68568); [ROCm][Bugfix] Avoid torch 2.13 Inductor gather bug in Nemotron diffusion sampler (@stefankoncarevic, #68694); [ROCm][CI] Dump child process stacks before the Model Executor test timeout (@bogdan-petkovic, #68652); [ROCm][Perf][Qwen4Exp] Export PLE short-conv prefill checkpoints on ROCm (@JaredforReal, #68574); [CI] Say when /ci rocm cache comes before the base image is pushed (@AndreasKaratzas, #68480)
   - **Why it matters**: Directly benefits **Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds** on **AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU** — **Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code**.
3. **Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)** ([#68171](https://github.com/vllm-project/vllm/pull/68171), [#68761](https://github.com/vllm-project/vllm/pull/68761), [#68454](https://github.com/vllm-project/vllm/pull/68454), [#68328](https://github.com/vllm-project/vllm/pull/68328))
   - **What changed**: [Quantization] Lower peak memory of online requantization, support block-FP8 to MXFP4 (@fxmarty-amd, #68171); [Model][Perf] Inkling 2: Humming expert GEMMs on Hopper (@WoosukKwon, #68761); [Bugfix][ROCm][MiniMax-M3.1] Fix the decode glue crash with preshuffled MXFP8 weights (@vgokhale, #68454); [Fast Start] Support compressed-tensors WNA16 pre-processed weights (@UNIDY2002, #68328); [Bugfix][Kernel] Fix MXFP8 linear layers whose N is not a multiple of 8 or 32 (@danielafrimi, #68353)
   - **Why it matters**: Directly benefits **100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit** on **NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X** — **Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput**.
4. **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** ([#68556](https://github.com/vllm-project/vllm/pull/68556), [#68487](https://github.com/vllm-project/vllm/pull/68487), [#68486](https://github.com/vllm-project/vllm/pull/68486), [#68220](https://github.com/vllm-project/vllm/pull/68220))
   - **What changed**: [Recipe] DeepSeek-V4.1-Flash: GB300 Dynamo AgentX presets from InferenceX #5015 (@Juntian777, #68556); [Recipe] MiniMax-M3.1-Flash: add H100 AgentX TP8 DSpark preset (@hshrivastava-droid, #68487); [Recipe] MiniMax-M3.1-Flash: add H200 AgentX TP8 DSpark preset (@hshrivastava-droid, #68486); [Recipe] Kimi-K3.1-Pro: document the GB300 DEP lanes' frontend session affinity and weight load format, align with InferenceX#5069 (@mispa-ms, #68220); [Frontend][DeepSeek-V4.1] Render tool search like deepseek-recipe (@robertgshaw2-redhat, #68211)
   - **Why it matters**: Directly benefits **Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)** on **NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters** — **Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens**.
5. **Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)** ([#68701](https://github.com/vllm-project/vllm/pull/68701), [#68449](https://github.com/vllm-project/vllm/pull/68449), [#68213](https://github.com/vllm-project/vllm/pull/68213), [#68356](https://github.com/vllm-project/vllm/pull/68356))
   - **What changed**: [Kimi K3.1][Specialized decode] Serve GQA DSpark drafts on the specialized drafter (@mgoin, #68701); [Docs] List speculative decoding methods supported by the Transformers backend (@hmellor, #68449); [Recipe] Kimi-K3.1-Pro: serve the preview DSpark draft in the GB300 AgentX presets, align with InferenceX#5069 (@mispa-ms, #68213); [CI][Test] Expect the decode-crossed Mamba hit in test_qwen_mtp_mamba_prefix_cache_hit_is_bounded (@stefankoncarevic, #68356); [Bugfix][Attention] Avoid GPU<->CPU sync in FlashInfer XQA ragged draft mask (@csahithi, #68782)
   - **Why it matters**: Directly benefits **Interactive coding assistants, agent loops, and low-batch-size real-time inference** on **NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners** — **Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth**.
6. **CI Enhancements** ([#68840](https://github.com/vllm-project/vllm/pull/68840), [#68148](https://github.com/vllm-project/vllm/pull/68148), [#68592](https://github.com/vllm-project/vllm/pull/68592), [#68494](https://github.com/vllm-project/vllm/pull/68494))
   - **What changed**: [CI] Move B200 DeepEP v2 MoE DP integration to nightly (@Thangnguyenvn98, #68840); [CI] Remove CODEOWNERS entries for users without write access (@hmellor, #68148); [CI][Test] Ignore the key file path when checking that the watermark key is not quoted (@JaredforReal, #68592); [CI] Move H100 fault tolerance E2E to nightly (@khluu, #68494); [CI] Enroll 10 steps in automatic sharding (@Thangnguyenvn98, #68257)
   - **Why it matters**: Directly benefits **General platform workloads and API consumers** on **Standard cluster nodes and runtime components** — **Operational reliability and lower maintenance toil**.
7. **Model Loader Enhancements** ([#68329](https://github.com/vllm-project/vllm/pull/68329))
   - **What changed**: [Model Loader] Remove the torchao reload decorator (@aoshen02, #68329)
   - **Why it matters**: Directly benefits **General platform workloads and API consumers** on **Standard cluster nodes and runtime components** — **Operational reliability and lower maintenance toil**.

### Last Week / Patch Pulse (Last Week in vLLM Style)
* `2026-11-20` [Recipe] Add HY4 ([#68844](https://github.com/vllm-project/vllm/pull/68844)) by @esmeetu
* `2026-11-20` [CI] Move B200 DeepEP v2 MoE DP integration to nightly ([#68840](https://github.com/vllm-project/vllm/pull/68840)) by @Thangnguyenvn98
* `2026-11-20` [Bugfix][Scheduler] Free consumed encoder inputs at schedule time (simplifies #67385) ([#68799](https://github.com/vllm-project/vllm/pull/68799)) by @njhill
* `2026-11-20` [CI] Free torch.compile state between tests in compile pass tests ([#68790](https://github.com/vllm-project/vllm/pull/68790)) by @mirza-halilcevic
* `2026-11-20` [Bugfix][Attention] Avoid GPU<->CPU sync in FlashInfer XQA ragged draft mask ([#68782](https://github.com/vllm-project/vllm/pull/68782)) by @csahithi
* `2026-11-20` [Misc] Trim get_decode_stream_seed docstring ([#68780](https://github.com/vllm-project/vllm/pull/68780)) by @njhill
* `2026-11-19` [Bugfix][Structured Output] Don't pin the grammar bitmask ([#68764](https://github.com/vllm-project/vllm/pull/68764)) by @lucamotz
* `2026-11-19` [Model][Perf] Inkling 2: Humming expert GEMMs on Hopper ([#68761](https://github.com/vllm-project/vllm/pull/68761)) by @WoosukKwon

---

## 2. Who Benefits? (Models, GPUs, Workloads & Your Bill)

| Capability Area | Models / Workloads Served | GPUs / Infrastructure Owned | Impact on Your Bill & SLAs |
|---|---|---|---|
| **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** | Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters | Standard single-node and multi-node GPU inference pools | Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet |
| **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** | Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds | AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU | Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code |
| **Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)** | 100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit | NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X | Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput |
| **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** | Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1) | NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters | Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens |
| **Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)** | Interactive coding assistants, agent loops, and low-batch-size real-time inference | NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners | Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth |
| **CI Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |
| **Model Loader Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |

---

## 3. What Does the Jargon Mean?

Plain-English translations for the systems and inference terms that show up in this release:

- **Extensible KV Cache**: Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.  
  *Bottom line for operators*: Unlocks 20–55% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes.
- **Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)**: Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.  
  *Bottom line for operators*: Boosts per-user token generation speed (interactivity/TPOT) by 1.4x–2.5x without changing output quality.
- **MLA & Sparse-MLA (Multi-head Latent Attention)**: An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.  
  *Bottom line for operators*: Slashes KV cache memory footprint on long contexts (32K–128K+), enabling far larger batch sizes per GPU.
- **NVFP4 / MXFP4 / FP8 Quantization**: 4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.  
  *Bottom line for operators*: Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks.
- **P/D Disaggregation (Prefill/Decode Split & NIXL)**: Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL.  
  *Bottom line for operators*: Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs.
- **DCP & PCP (Decode / Prefill Context Parallelism)**: Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP).  
  *Bottom line for operators*: Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K–1M token agentic prompts.
- **MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)**: Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs.  
  *Bottom line for operators*: Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU.
- **Piecewise & Breakable CUDA Graphs**: Capturing sequences of GPU kernel launches into replayable graphs (even across dynamic control flow) so the CPU doesn't launch hundreds of tiny kernels per token.  
  *Bottom line for operators*: Eliminates CPU bottlenecks during decode, cutting inter-token latency (ITL) by 5–25% without long `torch.compile` warmups.
- **Tiered KV Offloading & Prefix Caching**: Evicting and reusing computed KV cache blocks across GPU HBM, host CPU DRAM, local NVMe, or shared object storage instead of recomputing shared system prompts.  
  *Bottom line for operators*: Dramatically lowers prefill compute cost and TTFT for multi-turn chat and agent workloads that share long context prefixes.

---

## 4. Should I Upgrade?

**Executive Verdict**: **UPGRADE WITH CONFIG CHECK — High-ROI throughput/stability gains, but review breaking flag/API removals first**

### Pre-Upgrade Checklist (Breaking Changes, Removals & Flag Shifts)
- **[Before You Upgrade]** [Bugfix][Scheduler] Free consumed encoder inputs at schedule time (simplifies #67385) -> Action: Included in weekly merge #68799 (2026-11-20) ([#68799](https://github.com/vllm-project/vllm/pull/68799))
- **[Before You Upgrade]** [Bugfix][Attention] Avoid GPU<->CPU sync in FlashInfer XQA ragged draft mask -> Action: Included in weekly merge #68782 (2026-11-20) ([#68782](https://github.com/vllm-project/vllm/pull/68782))
- **[Before You Upgrade]** [Bugfix][Structured Output] Don't pin the grammar bitmask -> Action: Included in weekly merge #68764 (2026-11-19) ([#68764](https://github.com/vllm-project/vllm/pull/68764))
- **[Before You Upgrade]** [Bugfix][ROCm] Fix a cross-wave race in the batched kpool decode update -> Action: Included in weekly merge #68749 (2026-11-20) ([#68749](https://github.com/vllm-project/vllm/pull/68749))
- **[Before You Upgrade]** [Bugfix][HiSparse] Skip GPU restores for cancelled KV imports -> Action: Included in weekly merge #68729 (2026-11-19) ([#68729](https://github.com/vllm-project/vllm/pull/68729))
- **[Before You Upgrade]** [Bugfix][torch.compile] Find the compiled module through `*args` in the bytecode hook -> Action: Included in weekly merge #68717 (2026-11-19) ([#68717](https://github.com/vllm-project/vllm/pull/68717))
- **[Before You Upgrade]** [Bugfix][KV Offload] Release SimpleCPUOffload CPU caches on connector shutdown -> Action: Included in weekly merge #68710 (2026-11-19) ([#68710](https://github.com/vllm-project/vllm/pull/68710))
- **[Before You Upgrade]** [Bugfix][Transformers backend] Fuse packed qkv that is sliced, not split -> Action: Included in weekly merge #68698 (2026-11-19) ([#68698](https://github.com/vllm-project/vllm/pull/68698))

---

## 5. Where's the Proof?

### Quantified Benchmarks & Primary Proofs
- **Model** ([#68761](https://github.com/vllm-project/vllm/pull/68761)): [Model][Perf] Inkling 2: Humming expert GEMMs on Hopper
- **Kimi K3.1** ([#68701](https://github.com/vllm-project/vllm/pull/68701)): [Kimi K3.1][Specialized decode] Serve GQA DSpark drafts on the specialized drafter
- **Bugfix** ([#68698](https://github.com/vllm-project/vllm/pull/68698)): [Bugfix][Transformers backend] Fuse packed qkv that is sliced, not split
- **ROCm** ([#68574](https://github.com/vllm-project/vllm/pull/68574)): [ROCm][Perf][Qwen4Exp] Export PLE short-conv prefill checkpoints on ROCm
- **Recipe** ([#68556](https://github.com/vllm-project/vllm/pull/68556)): [Recipe] DeepSeek-V4.1-Flash: GB300 Dynamo AgentX presets from InferenceX #5015
- **Perf** ([#68526](https://github.com/vllm-project/vllm/pull/68526)): [Perf][Ray] Kill RayExecutorV2 actors before joining the monitor thread
- **Recipe** ([#68487](https://github.com/vllm-project/vllm/pull/68487)): [Recipe] MiniMax-M3.1-Flash: add H100 AgentX TP8 DSpark preset
- **Recipe** ([#68486](https://github.com/vllm-project/vllm/pull/68486)): [Recipe] MiniMax-M3.1-Flash: add H200 AgentX TP8 DSpark preset
- **Bugfix** ([#68386](https://github.com/vllm-project/vllm/pull/68386)): [Bugfix][Kernel] fused_qk_norm_rope: fix int32 offset overflow and NeoX partial-rotary corruption
- **Bugfix** ([#68353](https://github.com/vllm-project/vllm/pull/68353)): [Bugfix][Kernel] Fix MXFP8 linear layers whose N is not a multiple of 8 or 32

### Complete Feature Graduation & Enhancement Rollup
- **[Quantization]** [Quantization] Lower peak memory of online requantization, support block-FP8 to MXFP4 (@fxmarty-amd, #68171) ([#68171](https://github.com/vllm-project/vllm/pull/68171))
- **[Feature]** [Feature][Multimodal] Name every uncached item in the cache-miss error (@danielquintas8, #68429) ([#68429](https://github.com/vllm-project/vllm/pull/68429))
- **[Model Loader]** [Model Loader] Remove the torchao reload decorator (@aoshen02, #68329) ([#68329](https://github.com/vllm-project/vllm/pull/68329))
- **[ROCm]** [ROCm][CI] Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily (@sheralskumar, #68568) ([#68568](https://github.com/vllm-project/vllm/pull/68568))
- **[CI]** [CI] Move B200 DeepEP v2 MoE DP integration to nightly (@Thangnguyenvn98, #68840) ([#68840](https://github.com/vllm-project/vllm/pull/68840))
- **[Kimi K3.1]** [Kimi K3.1][Specialized decode] Serve GQA DSpark drafts on the specialized drafter (@mgoin, #68701) ([#68701](https://github.com/vllm-project/vllm/pull/68701))
- **[ROCm]** [ROCm][Bugfix] Avoid torch 2.13 Inductor gather bug in Nemotron diffusion sampler (@stefankoncarevic, #68694) ([#68694](https://github.com/vllm-project/vllm/pull/68694))
- **[ROCm]** [ROCm][CI] Dump child process stacks before the Model Executor test timeout (@bogdan-petkovic, #68652) ([#68652](https://github.com/vllm-project/vllm/pull/68652))
- **[ROCm]** [ROCm][Perf][Qwen4Exp] Export PLE short-conv prefill checkpoints on ROCm (@JaredforReal, #68574) ([#68574](https://github.com/vllm-project/vllm/pull/68574))
- **[Recipe]** [Recipe] DeepSeek-V4.1-Flash: GB300 Dynamo AgentX presets from InferenceX #5015 (@Juntian777, #68556) ([#68556](https://github.com/vllm-project/vllm/pull/68556))
- **[Recipe]** [Recipe] MiniMax-M3.1-Flash: add H100 AgentX TP8 DSpark preset (@hshrivastava-droid, #68487) ([#68487](https://github.com/vllm-project/vllm/pull/68487))
- **[Recipe]** [Recipe] MiniMax-M3.1-Flash: add H200 AgentX TP8 DSpark preset (@hshrivastava-droid, #68486) ([#68486](https://github.com/vllm-project/vllm/pull/68486))
- **[CI]** [CI] Say when /ci rocm cache comes before the base image is pushed (@AndreasKaratzas, #68480) ([#68480](https://github.com/vllm-project/vllm/pull/68480))
- **[Docs]** [Docs] List speculative decoding methods supported by the Transformers backend (@hmellor, #68449) ([#68449](https://github.com/vllm-project/vllm/pull/68449))
- **[ROCm]** [ROCm][CI][Test] Spawn the workers in the DSv4.1 mono merge AB test (@stefankoncarevic, #68391) ([#68391](https://github.com/vllm-project/vllm/pull/68391))
- **[ROCm]** [ROCm][CI] Measure process-local GPU memory in the Qwen3-VL leak test (@AndreasKaratzas, #68342) ([#68342](https://github.com/vllm-project/vllm/pull/68342))
- **[CI]** [CI][ROCm] Clean up the specialized decode test primitives (follow-up to #67135) (@divakar-amd, #68311) ([#68311](https://github.com/vllm-project/vllm/pull/68311))
- **[ROCm]** [ROCm][Perf][GDN] Export Triton and AITER FlyDSL prefill checkpoints on ROCm (@JaredforReal, #68310) ([#68310](https://github.com/vllm-project/vllm/pull/68310))
- **[ROCm]** [ROCm][Test] Check the AITER delayed mHC pre against the residual it wrote (@AndreasKaratzas, #68300) ([#68300](https://github.com/vllm-project/vllm/pull/68300))
- **[ROCm]** [ROCm][CI] Lock every render node for multi-GPU DPX jobs (@sheralskumar, #68256) ([#68256](https://github.com/vllm-project/vllm/pull/68256))
- **[Recipe]** [Recipe] Kimi-K3.1-Pro: document the GB300 DEP lanes' frontend session affinity and weight load format, align with InferenceX#5069 (@mispa-ms, #68220) ([#68220](https://github.com/vllm-project/vllm/pull/68220))
- **[Recipe]** [Recipe] Kimi-K3.1-Pro: serve the preview DSpark draft in the GB300 AgentX presets, align with InferenceX#5069 (@mispa-ms, #68213) ([#68213](https://github.com/vllm-project/vllm/pull/68213))
- **[Frontend]** [Frontend][DeepSeek-V4.1] Render tool search like deepseek-recipe (@robertgshaw2-redhat, #68211) ([#68211](https://github.com/vllm-project/vllm/pull/68211))
- **[ROCm]** [ROCm][CI] Force the ASM path in test_online_mxfp4_hadamard[aiter-asm] (@mirza-halilcevic, #68188) ([#68188](https://github.com/vllm-project/vllm/pull/68188))
- **[Perf]** [Perf][KDA] Export Triton prefill checkpoints for Kimi-Linear (@JaredforReal, #68157) ([#68157](https://github.com/vllm-project/vllm/pull/68157))
- **[Spec Decode]** [Spec Decode] Pass multimodal embeddings to NemotronH MTP (@anhtra3889, #68153) ([#68153](https://github.com/vllm-project/vllm/pull/68153))
- **[Model]** [Model][Perf] Inkling 2: Humming expert GEMMs on Hopper (@WoosukKwon, #68761) ([#68761](https://github.com/vllm-project/vllm/pull/68761))
- **[KV Connector]** [KV Connector] Honor per-request Mooncake offload limits (@hj-mistral, #68529) ([#68529](https://github.com/vllm-project/vllm/pull/68529))
- **[Model Loader]** [Model Loader] Direct reload reruns post-load processing on the cold-start modules (LoRA) (@aoshen02, #68345) ([#68345](https://github.com/vllm-project/vllm/pull/68345))
- **[Model]** [Model] Add HY4 Flash and multimodal support (@jeejeelee, #68296) ([#68296](https://github.com/vllm-project/vllm/pull/68296))
- **[Refactor]** [Refactor] Remove dead code in models (@yewentao256, #68510) ([#68510](https://github.com/vllm-project/vllm/pull/68510))
- **[Fast Start]** [Fast Start] Remove copy mode for fast start IPC loader (@Isotr0py, #68388) ([#68388](https://github.com/vllm-project/vllm/pull/68388))
- **[CI]** [CI] Remove CODEOWNERS entries for users without write access (@hmellor, #68148) ([#68148](https://github.com/vllm-project/vllm/pull/68148))
- **[Perf]** [Perf][Frontend] Load chat `prompt_embeds` from the `base64` str not an encoded copy (@LuisRobaina, #68236) ([#68236](https://github.com/vllm-project/vllm/pull/68236))
- **[Bugfix]** [Bugfix][ROCm] Fix a cross-wave race in the batched kpool decode update (@djramic, #68749) ([#68749](https://github.com/vllm-project/vllm/pull/68749))
- **[Bugfix]** [Bugfix][ROCm][MiniMax-M3.1] Fix the decode glue crash with preshuffled MXFP8 weights (@vgokhale, #68454) ([#68454](https://github.com/vllm-project/vllm/pull/68454))
- **[Bugfix]** [Bugfix][Kimi-K3] Reduce the shared expert for MegaMoE without sequence parallelism (@abmfy, #68373) ([#68373](https://github.com/vllm-project/vllm/pull/68373))
- **[Bugfix]** [Bugfix][Multimodal] Fix Qwen3-VL M-RoPE input positions after a pruned video (@jiahansu, #68270) ([#68270](https://github.com/vllm-project/vllm/pull/68270))
- **[Bugfix]** [Bugfix][Multimodal] Turn off the extensible KV cache for Unlimited-OCR-2 (@subhashpolisetti, #68254) ([#68254](https://github.com/vllm-project/vllm/pull/68254))
- **[Bugfix]** [Bugfix][NIXL] Don't invalidate a disconnected engine whose agents are gone (@njhill, #68227) ([#68227](https://github.com/vllm-project/vllm/pull/68227))
- **[Transformers backend]** [Transformers backend] Trace decorated forwards and pin `cache` in the fx tracer (@hmellor, #68724) ([#68724](https://github.com/vllm-project/vllm/pull/68724))
- **[Recipe]** [Recipe] Add HY4 (@esmeetu, #68844) ([#68844](https://github.com/vllm-project/vllm/pull/68844))
- **[CI]** [CI] Free torch.compile state between tests in compile pass tests (@mirza-halilcevic, #68790) ([#68790](https://github.com/vllm-project/vllm/pull/68790))
- **[Misc]** [Misc] Trim get_decode_stream_seed docstring (@njhill, #68780) ([#68780](https://github.com/vllm-project/vllm/pull/68780))
- **[Bugfix]** [Bugfix][torch.compile] Find the compiled module through `*args` in the bytecode hook (@hmellor, #68717) ([#68717](https://github.com/vllm-project/vllm/pull/68717))
- **[XPU]** [XPU][CI]Move BMG Engine (1 GPU) on k8s to avoid random hang (@zxd1997066, #68653) ([#68653](https://github.com/vllm-project/vllm/pull/68653))
- **[CI]** [CI][XPU] Add Hybrid SSM NixlConnector PD prefix cache test to Intel CI (@faaany, #68617) ([#68617](https://github.com/vllm-project/vllm/pull/68617))
- **[Rust Frontend]** [Rust Frontend] Serve /generative_scoring (@BugenZhao, #68612) ([#68612](https://github.com/vllm-project/vllm/pull/68612))
- **[CI]** [CI][Test] Skip HYV4 and Inkling in PP equivalence below Hopper (@JaredforReal, #68604) ([#68604](https://github.com/vllm-project/vllm/pull/68604))
- **[CI]** [CI][Test] Ignore the key file path when checking that the watermark key is not quoted (@JaredforReal, #68592) ([#68592](https://github.com/vllm-project/vllm/pull/68592))
- **[Build]** [Build] Cap nvidia-cudnn-frontend below 1.33 (@Thangnguyenvn98, #68566) ([#68566](https://github.com/vllm-project/vllm/pull/68566))
- **[Rust Frontend]** [Rust Frontend][EPD] Report metadata-only input capability in engine handshake (@gty111, #68565) ([#68565](https://github.com/vllm-project/vllm/pull/68565))
- **[Refactor]** [Refactor] Move CUDA graph sizing policy into Platform (@Pb314314, #68552) ([#68552](https://github.com/vllm-project/vllm/pull/68552))
- **[XPU]** [XPU][CI] Enable sampler-flag and logits-processor tests on XPU (@zhenwei-intel, #68541) ([#68541](https://github.com/vllm-project/vllm/pull/68541))
- **[Perf]** [Perf][Ray] Kill RayExecutorV2 actors before joining the monitor thread (@AndreasKaratzas, #68526) ([#68526](https://github.com/vllm-project/vllm/pull/68526))
- **[CI]** [CI] Move H100 fault tolerance E2E to nightly (@khluu, #68494) ([#68494](https://github.com/vllm-project/vllm/pull/68494))
- **[Structured Output]** [Structured Output] Simplify allocate_token_bitmask (@yzong-rh, #68484) ([#68484](https://github.com/vllm-project/vllm/pull/68484))
- **[CI/Build]** [CI/Build] Make Python 3.14 the default for images and CI (@njhill, #68457) ([#68457](https://github.com/vllm-project/vllm/pull/68457))
- **[Docs]** [Docs] Raise the bar for PR descriptions (@fxmarty-amd, #68404) ([#68404](https://github.com/vllm-project/vllm/pull/68404))
- **[Rust Frontend]** [Rust Frontend] Support batched prompts on /v1/completions (@BugenZhao, #68390) ([#68390](https://github.com/vllm-project/vllm/pull/68390))
- **[CI]** [CI][Test] Expect the decode-crossed Mamba hit in test_qwen_mtp_mamba_prefix_cache_hit_is_bounded (@stefankoncarevic, #68356) ([#68356](https://github.com/vllm-project/vllm/pull/68356))
- **[CI]** [CI] Restore the default device after test_fc_layer_quant_config_usage (@bogdan-petkovic, #68350) ([#68350](https://github.com/vllm-project/vllm/pull/68350))
- **[XPU]** [XPU] Run Transformers backend attention sinks test on XPU (@Liangliang-Ma, #68349) ([#68349](https://github.com/vllm-project/vllm/pull/68349))
- **[Build]** [Build] Point vllm-flash-attn at vllm-project/flash-attention#222 for CI (@chatouis, #68348) ([#68348](https://github.com/vllm-project/vllm/pull/68348))
- **[Entrypoint]** [Entrypoint] Use tri-state for add_special_tokens in pooling entrypoint. (@noooop, #68344) ([#68344](https://github.com/vllm-project/vllm/pull/68344))
- **[Fast Start]** [Fast Start] Support compressed-tensors WNA16 pre-processed weights (@UNIDY2002, #68328) ([#68328](https://github.com/vllm-project/vllm/pull/68328))
- **[XPU]** [XPU][Tests] Run Triton-only ReplaySSM/SSU tests on XPU (@faaany, #68318) ([#68318](https://github.com/vllm-project/vllm/pull/68318))
- **[Suggestion]** [Suggestion] Drop the CUDA graph wrapper bypass flag (@LucasWilkinson, #68307) ([#68307](https://github.com/vllm-project/vllm/pull/68307))
- **[Recipe]** [Recipe] Add HY4 Flash (@jeejeelee, #68295) ([#68295](https://github.com/vllm-project/vllm/pull/68295))
- **[CI]** [CI][XPU] Compare inactive default mm LoRA runs via top-k logprobs (@khluu, #68266) ([#68266](https://github.com/vllm-project/vllm/pull/68266))
- **[CI]** [CI] Enroll 10 steps in automatic sharding (@Thangnguyenvn98, #68257) ([#68257](https://github.com/vllm-project/vllm/pull/68257))
- **[Rust Frontend]** [Rust Frontend] Use the model's default temperature when a gRPC request omits it (@JulienDarve, #68253) ([#68253](https://github.com/vllm-project/vllm/pull/68253))
- **[CI]** [CI] Upload command spans first and give big job-end flushes more time (@Thangnguyenvn98, #68208) ([#68208](https://github.com/vllm-project/vllm/pull/68208))
- **[Multimodal]** [Multimodal] Pass placement with Omni embeddings to drop the audio-in-video host read (@AndreasKaratzas, #68200) ([#68200](https://github.com/vllm-project/vllm/pull/68200))
- **[Rust Frontend]** [Rust Frontend] Add server-level mm processor kwargs support (@Isotr0py, #68186) ([#68186](https://github.com/vllm-project/vllm/pull/68186))
- **[Fast Start]** [Fast Start] Support ModelOpt INT8 pre-processed weights (@UNIDY2002, #68176) ([#68176](https://github.com/vllm-project/vllm/pull/68176))
- **[Doc]** [Doc] Sleep mode: free a KV connector's host memory with Mooncake standalone-store (@aoshen02, #68175) ([#68175](https://github.com/vllm-project/vllm/pull/68175))
- **[Doc]** [Doc] Routed experts: row storage, replica affinity, sizing and cache resets (@aoshen02, #68174) ([#68174](https://github.com/vllm-project/vllm/pull/68174))
- **[Tests]** [Tests] Reuse single-rank parallel groups for faster GPU unit tests (@fxmarty-amd, #68162) ([#68162](https://github.com/vllm-project/vllm/pull/68162))
- **[Perf]** [Perf][Qwen4Exp] Raster the fused HC up+gate mix tiles N-fastest (@gau-nernst, #68154) ([#68154](https://github.com/vllm-project/vllm/pull/68154))
- **[Docs]** [Docs] Add add-cli-arg agent skill and drop arg_utils.py code owner (@hmellor, #68144) ([#68144](https://github.com/vllm-project/vllm/pull/68144))
- **[Bugfix]** [Bugfix][Scheduler] Free consumed encoder inputs at schedule time (simplifies #67385) (@njhill, #68799) ([#68799](https://github.com/vllm-project/vllm/pull/68799))
- **[Bugfix]** [Bugfix][Attention] Avoid GPU<->CPU sync in FlashInfer XQA ragged draft mask (@csahithi, #68782) ([#68782](https://github.com/vllm-project/vllm/pull/68782))
- **[Bugfix]** [Bugfix][Structured Output] Don't pin the grammar bitmask (@lucamotz, #68764) ([#68764](https://github.com/vllm-project/vllm/pull/68764))
- **[Bugfix]** [Bugfix][HiSparse] Skip GPU restores for cancelled KV imports (@zhenwenqi2024, #68729) ([#68729](https://github.com/vllm-project/vllm/pull/68729))
- **[Bugfix]** [Bugfix][KV Offload] Release SimpleCPUOffload CPU caches on connector shutdown (@bogdan-petkovic, #68710) ([#68710](https://github.com/vllm-project/vllm/pull/68710))
- **[Bugfix]** [Bugfix][Transformers backend] Fuse packed qkv that is sliced, not split (@bigPYJ1151, #68698) ([#68698](https://github.com/vllm-project/vllm/pull/68698))
- **[Bugfix]** [Bugfix][Multimodal] Accept NumPy images in vLLM's own HF processors (@Arsh624, #68655) ([#68655](https://github.com/vllm-project/vllm/pull/68655))
- **[Bugfix]** [Bugfix][HiSparse] Keep shared KV layers bound when the target is host-resident (@my-git9, #68586) ([#68586](https://github.com/vllm-project/vllm/pull/68586))
- **[Bugfix]** [Bugfix][Rust Frontend] Decode the Mooncake store's lookup_lease stats (@gcanlin, #68584) ([#68584](https://github.com/vllm-project/vllm/pull/68584))
- **[Bugfix]** [Bugfix] Make Unlimited-OCR-2 DASH routing batch invariant (@gty111, #68563) ([#68563](https://github.com/vllm-project/vllm/pull/68563))
- **[Bugfix]** [Bugfix][KV Cache] Don't size KV cache groups from draft-only sliding-window buckets (@robertgshaw2-redhat, #68533) ([#68533](https://github.com/vllm-project/vllm/pull/68533))
- **[Bugfix]** [Bugfix][Fast Start] Keep the source daemon up when the compiled cache cannot be published (@tryryry, #68460) ([#68460](https://github.com/vllm-project/vllm/pull/68460))
- **[Bugfix]** [Bugfix][Kernel] fused_qk_norm_rope: fix int32 offset overflow and NeoX partial-rotary corruption (@simon-veitner-redhat, #68386) ([#68386](https://github.com/vllm-project/vllm/pull/68386))
- **[Bugfix]** [Bugfix] Fix GPU sync check failures in NemotronLabsDiffusion (@mirza-halilcevic, #68376) ([#68376](https://github.com/vllm-project/vllm/pull/68376))
- **[Bugfix]** [Bugfix][Multimodal] Normalize negative-stride image inputs (@Woolgathererer, #68367) ([#68367](https://github.com/vllm-project/vllm/pull/68367))
- **[Bugfix]** [Bugfix][KV Offload] Report the final SWA tail in first_live_chunk_idx (@amirfr3, #68359) ([#68359](https://github.com/vllm-project/vllm/pull/68359))
- **[Bugfix]** [Bugfix][Kernel] Fix MXFP8 linear layers whose N is not a multiple of 8 or 32 (@danielafrimi, #68353) ([#68353](https://github.com/vllm-project/vllm/pull/68353))
- **[Bugfix]** [Bugfix] Peek at the EngineCore exit status instead of reaping it in the liveness monitor (@AndreasKaratzas, #68288) ([#68288](https://github.com/vllm-project/vllm/pull/68288))
- **[Bugfix]** [Bugfix][Spec Decode] Reject non-finite Newton steps in the acceptance estimator refit (@fuscof-ibm, #68164) ([#68164](https://github.com/vllm-project/vllm/pull/68164))

**Key Feature Gates / API Identifiers**: `mi300_dpx`, `mi300_1`, `prompt_embeds`, `base64`, `cache`, `*args`