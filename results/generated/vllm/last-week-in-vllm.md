# What's New in vLLM Last Week in VLLM (Week Ending 2026-11-19)

## High-Level Explanation
vLLM Last Week in VLLM (Week Ending 2026-11-19) focuses on Multi-Vendor Accelerator Scaling, Frontier MoE & Sparse-MLA Speedups, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 100 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.

## 1. What Are the High-Level Changes?
- **Multi-Vendor Accelerator Scaling**: Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code.
- **Frontier MoE & Sparse-MLA Speedups**: Improves frontier moe & sparse-mla speedups for frontier mixture-of-experts (moe) reasoning and agentic models (deepseek-v4/v4.1, glm-5.3, kimi-k3/k3.1, minimax-m3.1) running on nvidia blackwell (gb200/gb300/b200), hopper (h100/h200), and multi-node expert parallel (ep) clusters, delivering delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens.
- **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend**: Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet.
- **Disaggregated Serving**: Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore.
- **Model Enhancements**: Improves model enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil.

## 2. Who Benefits? (Models, GPUs & Your Bill)
| Workload / Team | Models / Services | GPUs / Hardware | Practical Impact |
|---|---|---|---|
| **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** | Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds | AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU | Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code |
| **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** | Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1) | NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters | Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens |
| **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** | Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters | Standard single-node and multi-node GPU inference pools | Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet |
| **Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore** | Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients | Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways | Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore |
| **Model Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |
| **Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)** | 100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit | NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X | Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput |
| **Extensible KV Cache, Memory Budgeting & Tiered Offloading** | High-concurrency chat APIs, long-context coding agents (32K–128K+), and multi-turn RAG workloads | NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers | Expands effective KV capacity by 25–55% per GPU, serving more concurrent users per rack without adding hardware |

## 3. What Does the Jargon Mean?
- **Extensible KV Cache**: Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction. Why it matters: Unlocks 20–55% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes.
- **Model Runner V2 (MRV2)**: vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding. Why it matters: Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity.
- **MLA & Sparse-MLA (Multi-head Latent Attention)**: An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing. Why it matters: Slashes KV cache memory footprint on long contexts (32K–128K+), enabling far larger batch sizes per GPU.
- **NVFP4 / MXFP4 / FP8 Quantization**: 4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores. Why it matters: Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks.
- **P/D Disaggregation (Prefill/Decode Split & NIXL)**: Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL. Why it matters: Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs.
- **DCP & PCP (Decode / Prefill Context Parallelism)**: Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP). Why it matters: Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K–1M token agentic prompts.
- **MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)**: Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs. Why it matters: Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU.
- **Piecewise & Breakable CUDA Graphs**: Capturing sequences of GPU kernel launches into replayable graphs (even across dynamic control flow) so the CPU doesn't launch hundreds of tiny kernels per token. Why it matters: Eliminates CPU bottlenecks during decode, cutting inter-token latency (ITL) by 5–25% without long `torch.compile` warmups.
- **Tiered KV Offloading & Prefix Caching**: Evicting and reusing computed KV cache blocks across GPU HBM, host CPU DRAM, local NVMe, or shared object storage instead of recomputing shared system prompts. Why it matters: Dramatically lowers prefill compute cost and TTFT for multi-turn chat and agent workloads that share long context prefixes.

## 4. Should I Upgrade?
**Verdict**: UPGRADE WITH CONFIG CHECK — High-ROI throughput/stability gains, but review breaking flag/API removals first
- **Before You Upgrade**: Match ignored unexpected keys after renaming -> Action: Included in weekly merge #69918 (2026-11-25). ([#69918](https://github.com/vllm-project/vllm/pull/69918))
- **Before You Upgrade**: Import shared host KV on every node's host leader -> Action: Included in weekly merge #69901 (2026-11-25). ([#69901](https://github.com/vllm-project/vllm/pull/69901))
- **Before You Upgrade**: Fix duplicate kv quant mode int enum -> Action: Included in weekly merge #69816 (2026-11-25). ([#69816](https://github.com/vllm-project/vllm/pull/69816))
- **Before You Upgrade**: Align CUDA graph capture input_ids and inputs_embeds with execute_model -> Action: Included in weekly merge #69795 (2026-11-25). ([#69795](https://github.com/vllm-project/vllm/pull/69795))
- **Before You Upgrade**: Make vision FA3 batch invariant -> Action: Included in weekly merge #69774 (2026-11-25). ([#69774](https://github.com/vllm-project/vllm/pull/69774))
- **Before You Upgrade**: Apply the logits soft cap in place -> Action: Included in weekly merge #69674 (2026-11-26). ([#69674](https://github.com/vllm-project/vllm/pull/69674))
- **Before You Upgrade**: Account for PCP size in DP supervisor device_ids -> Action: Included in weekly merge #69664 (2026-11-25). ([#69664](https://github.com/vllm-project/vllm/pull/69664))
- **Before You Upgrade**: Keep synchronous load blocks out of block zeroing -> Action: Included in weekly merge #69656 (2026-11-26). ([#69656](https://github.com/vllm-project/vllm/pull/69656))
- **Deprecation**: Remove LM Format Enforcer structured outputs backend (@WoosukKwon, #69564). ([#69564](https://github.com/vllm-project/vllm/pull/69564))
- **Security**: Bound synchronous media body fetches (@jperezdealgaba, #69461). ([#69461](https://github.com/vllm-project/vllm/pull/69461))

## 5. Technical Deep Dive (What's the Big Deal Under the Hood?)
### 1. Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU) ([#69564](https://github.com/vllm-project/vllm/pull/69564), [#69752](https://github.com/vllm-project/vllm/pull/69752), [#69749](https://github.com/vllm-project/vllm/pull/69749), [#69952](https://github.com/vllm-project/vllm/pull/69952))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.
- **Technical change**: Remove LM Format Enforcer structured outputs backend (@WoosukKwon, #69564).
- **Technical change**: DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752).
- **Technical change**: Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749).
- **Technical change**: Move MI300 Quantization, MoE, distributed, and batch invariance jobs to DPX (@sheralskumar, #69952).
- **Operational impact**: Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code
### 2. Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3) ([#69624](https://github.com/vllm-project/vllm/pull/69624), [#69669](https://github.com/vllm-project/vllm/pull/69669), [#69584](https://github.com/vllm-project/vllm/pull/69584), [#69689](https://github.com/vllm-project/vllm/pull/69689))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.
- **Technical change**: Kimi-K3.1-Pro: serve the model card's sampling defaults; Kimi-K3 / K3.1-Pro: opt-in strict tool calls (@AndreasKaratzas, #69624).
- **Technical change**: Specialized decode: compile each kernel once, only for captured sizes (@mgoin, #69669).
- **Technical change**: Render image and text parts in request order (@AndreasKaratzas, #69584).
- **Technical change**: Detect MLA from the latent shape and support Youtu-LLM (@hmellor, #69689).
- **Operational impact**: Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens
### 3. Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend ([#69726](https://github.com/vllm-project/vllm/pull/69726), [#69736](https://github.com/vllm-project/vllm/pull/69736), [#69695](https://github.com/vllm-project/vllm/pull/69695), [#69683](https://github.com/vllm-project/vllm/pull/69683))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.
- **Technical change**: Decouple `nemotron_nas` from llama (@vyomakesh0728, #69726).
- **Technical change**: SM100/SM103 skinny GEMM plans for Qwen3, Qwen3.5/3.6 MoE and Qwen3.8 decode projections (@Johnsonms, #69736).
- **Technical change**: Apply checkpoint conversions that split a tensor (@hmellor, #69695).
- **Technical change**: Support OmniASR via the Transformers backend (@El-euchidali, #69683).
- **Operational impact**: Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet
### 4. Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore ([#69864](https://github.com/vllm-project/vllm/pull/69864), [#69566](https://github.com/vllm-project/vllm/pull/69566), [#69401](https://github.com/vllm-project/vllm/pull/69401), [#69598](https://github.com/vllm-project/vllm/pull/69598))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.
- **Technical change**: Cap Qwen3-VL videos at 32 per prompt by default (@BugenZhao, #69864).
- **Technical change**: Parse every checkpoint JSON file like Python's json (@BugenZhao, #69566).
- **Technical change**: Write only the used FlashInfer prefill checkpoint states (@gau-nernst, #69401).
- **Technical change**: Remove the phi4_mini_json tool parser (@BugenZhao, #69598).
- **Operational impact**: Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore
### 5. Model Enhancements ([#69929](https://github.com/vllm-project/vllm/pull/69929), [#69703](https://github.com/vllm-project/vllm/pull/69703))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating model enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.
- **Technical change**: Remove TeleFLM (@vyomakesh0728, #69929).
- **Technical change**: Decouple Afmoe, Jamba and IQuestLoopCoder from llama.py (@vyomakesh0728, #69703).
- **Operational impact**: Operational reliability and lower maintenance toil
### 6. Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming) ([#69738](https://github.com/vllm-project/vllm/pull/69738), [#69483](https://github.com/vllm-project/vllm/pull/69483), [#69446](https://github.com/vllm-project/vllm/pull/69446))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.
- **Technical change**: Nemotron Shortcut SDSA: convert NVFP4 K/V once per request by key position (@danielafrimi, #69738).
- **Technical change**: Remove dead code quantizations (@yewentao256, #69483).
- **Technical change**: Keep MXFP8 linear weights in FP8 on SM90 at TP1 (@Ganto12, #69446).
- **Operational impact**: Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput

### Weekly / Patch Merge Pulse
- `2026-11-25` [Transformers backend] Fix `model_impl="transformers"` for architectures Transformers doesn't have ([#69955](https://github.com/vllm-project/vllm/pull/69955)) by @lucamotz
- `2026-11-26` [ROCm][CI] Move MI300 Quantization, MoE, distributed, and batch invariance jobs to DPX ([#69952](https://github.com/vllm-project/vllm/pull/69952)) by @sheralskumar
- `2026-11-25` [Model] Remove TeleFLM ([#69929](https://github.com/vllm-project/vllm/pull/69929)) by @vyomakesh0728
- `2026-11-26` [Refactor][Weight Transfer] Extract shared _LazyEngineFactory base class ([#69926](https://github.com/vllm-project/vllm/pull/69926)) by @aoshen02
- `2026-11-25` [Bugfix][Transformers backend] Match ignored unexpected keys after renaming ([#69918](https://github.com/vllm-project/vllm/pull/69918)) by @hmellor
- `2026-11-25` [Bugfix][HiSparse][NIXL] Import shared host KV on every node's host leader ([#69901](https://github.com/vllm-project/vllm/pull/69901)) by @Ankit1478
- `2026-11-26` [Qwen4Exp] Keep QSA cache layouts consistent across prefill and decode ([#69882](https://github.com/vllm-project/vllm/pull/69882)) by @peakcrosser7
- `2026-11-25` [Transformers backend] Splice the fused MoE into the MoE block's traced forward ([#69868](https://github.com/vllm-project/vllm/pull/69868)) by @hmellor

## 6. Where's the Proof?
- **Kernel** ([#69787](https://github.com/vllm-project/vllm/pull/69787)): Bump FlashKDA to a32181e (codegen opts + 132→9 variant pruning).
- **ROCm** ([#69752](https://github.com/vllm-project/vllm/pull/69752)): DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195.
- **Perf** ([#69738](https://github.com/vllm-project/vllm/pull/69738)): Nemotron Shortcut SDSA: convert NVFP4 K/V once per request by key position.
- **Perf** ([#69736](https://github.com/vllm-project/vllm/pull/69736)): SM100/SM103 skinny GEMM plans for Qwen3, Qwen3.5/3.6 MoE and Qwen3.8 decode projections.
- **Kernel** ([#69698](https://github.com/vllm-project/vllm/pull/69698)): Keep L1::no_allocate on CuTeDSL GEMM epilogue stores.
- **Transformers backend** ([#69689](https://github.com/vllm-project/vllm/pull/69689)): Detect MLA from the latent shape and support Youtu-LLM.
- **KV Offload** ([#69677](https://github.com/vllm-project/vllm/pull/69677)): Share replicated MLA KV per host.
- **Perf** ([#69669](https://github.com/vllm-project/vllm/pull/69669)): Specialized decode: compile each kernel once, only for captured sizes.
- **Perf** ([#69637](https://github.com/vllm-project/vllm/pull/69637)): Find GLM-4.7 tool-call arguments in linear time.
- **Perf** ([#69636](https://github.com/vllm-project/vllm/pull/69636)): Skip streaming argument deltas in a single-pass parse.
- **ROCm** ([#69752](https://github.com/vllm-project/vllm/pull/69752)): DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752).
- **Recipe** ([#69749](https://github.com/vllm-project/vllm/pull/69749)): Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749).

### Complete Feature Graduation & Enhancement Rollup
- **[Deprecation]** Remove LM Format Enforcer structured outputs backend (@WoosukKwon, #69564). ([#69564](https://github.com/vllm-project/vllm/pull/69564))
- **[ROCm]** DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752). ([#69752](https://github.com/vllm-project/vllm/pull/69752))
- **[Recipe]** Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749). ([#69749](https://github.com/vllm-project/vllm/pull/69749))
- **[Model]** Remove TeleFLM (@vyomakesh0728, #69929). ([#69929](https://github.com/vllm-project/vllm/pull/69929))
- **[Recipe]** Kimi-K3.1-Pro: serve the model card's sampling defaults; Kimi-K3 / K3.1-Pro: opt-in strict tool calls (@AndreasKaratzas, #69624). ([#69624](https://github.com/vllm-project/vllm/pull/69624))
- **[Model]** Decouple `nemotron_nas` from llama (@vyomakesh0728, #69726). ([#69726](https://github.com/vllm-project/vllm/pull/69726))
- **[ROCm]** Move MI300 Quantization, MoE, distributed, and batch invariance jobs to DPX (@sheralskumar, #69952). ([#69952](https://github.com/vllm-project/vllm/pull/69952))
- **[Rust Frontend]** Cap Qwen3-VL videos at 32 per prompt by default (@BugenZhao, #69864). ([#69864](https://github.com/vllm-project/vllm/pull/69864))
- **[Perf]** Nemotron Shortcut SDSA: convert NVFP4 K/V once per request by key position (@danielafrimi, #69738). ([#69738](https://github.com/vllm-project/vllm/pull/69738))
- **[Perf]** SM100/SM103 skinny GEMM plans for Qwen3, Qwen3.5/3.6 MoE and Qwen3.8 decode projections (@Johnsonms, #69736). ([#69736](https://github.com/vllm-project/vllm/pull/69736))
- **[CI]** Pool 16 decode pairs at TP8 in the mono layers test (@stefankoncarevic, #69707). ([#69707](https://github.com/vllm-project/vllm/pull/69707))
- **[Transformers backend]** Apply checkpoint conversions that split a tensor (@hmellor, #69695). ([#69695](https://github.com/vllm-project/vllm/pull/69695))
- **[CI]** Run (H200) EC Filesystem Tiering on a 35GB MIG slice (@Thangnguyenvn98, #69693). ([#69693](https://github.com/vllm-project/vllm/pull/69693))
- **[Perf]** Specialized decode: compile each kernel once, only for captured sizes (@mgoin, #69669). ([#69669](https://github.com/vllm-project/vllm/pull/69669))
- **[Rust Frontend]** Parse every checkpoint JSON file like Python's json (@BugenZhao, #69566). ([#69566](https://github.com/vllm-project/vllm/pull/69566))
- **[Perf]** Write only the used FlashInfer prefill checkpoint states (@gau-nernst, #69401). ([#69401](https://github.com/vllm-project/vllm/pull/69401))
- **[CI]** Spawn the GPU memory wait worker (@RuibinCheung, #69374). ([#69374](https://github.com/vllm-project/vllm/pull/69374))
- **[Perf]** Use smaller tiles in the prefix_prefill kernel on RDNA (ROCM_ATTN prefill) (@lijipeng787, #69321). ([#69321](https://github.com/vllm-project/vllm/pull/69321))
- **[XPU]** Support sequence parallelism with pipeline parallelism (@chaojun-zhang, #69314). ([#69314](https://github.com/vllm-project/vllm/pull/69314))
- **[Model]** Decouple Afmoe, Jamba and IQuestLoopCoder from llama.py (@vyomakesh0728, #69703). ([#69703](https://github.com/vllm-project/vllm/pull/69703))
- **[Model]** Support OmniASR via the Transformers backend (@El-euchidali, #69683). ([#69683](https://github.com/vllm-project/vllm/pull/69683))
- **[KV Offload]** Share replicated MLA KV per host (@Etelis, #69677). ([#69677](https://github.com/vllm-project/vllm/pull/69677))
- **[Model]** Enable data-parallel multimodal encoder for HY4 (@grYe99, #69676). ([#69676](https://github.com/vllm-project/vllm/pull/69676))
- **[Misc]** Remove remaining xformers references (@WoosukKwon, #69794). ([#69794](https://github.com/vllm-project/vllm/pull/69794))
- **[Core]** Remove dead pcp_world_size plumbing from KV cache managers (@ZJY0516, #69706). ([#69706](https://github.com/vllm-project/vllm/pull/69706))
- **[CI/Build]** Remove synthetic LoRA model tests (@jeejeelee, #69697). ([#69697](https://github.com/vllm-project/vllm/pull/69697))
- **[Rust Frontend]** Remove the phi4_mini_json tool parser (@BugenZhao, #69598). ([#69598](https://github.com/vllm-project/vllm/pull/69598))
- **[Refactor]** Remove dead code quantizations (@yewentao256, #69483). ([#69483](https://github.com/vllm-project/vllm/pull/69483))
- **[Cleanup]** Bump ROCm gfx1250 to torch 2.12 and remove workarounds for torch <= 2.12 (@WoosukKwon, #69572). ([#69572](https://github.com/vllm-project/vllm/pull/69572))
- **[Bugfix]** Import shared host KV on every node's host leader (@Ankit1478, #69901). ([#69901](https://github.com/vllm-project/vllm/pull/69901))
- **[Bugfix]** Align CUDA graph capture input_ids and inputs_embeds with execute_model (@specture724, #69795). ([#69795](https://github.com/vllm-project/vllm/pull/69795))
- **[Bugfix]** Account for PCP size in DP supervisor device_ids (@pisceskkk, #69664). ([#69664](https://github.com/vllm-project/vllm/pull/69664))
- **[Bugfix]** Render image and text parts in request order (@AndreasKaratzas, #69584). ([#69584](https://github.com/vllm-project/vllm/pull/69584))
- **[Bugfix]** Keep MXFP8 linear weights in FP8 on SM90 at TP1 (@Ganto12, #69446). ([#69446](https://github.com/vllm-project/vllm/pull/69446))
- **[Bugfix]** Fix indexer prefill logits lifetime and fused chunk planning (@Heisenberg-Yin, #69332). ([#69332](https://github.com/vllm-project/vllm/pull/69332))
- **[Transformers backend]** Fix `model_impl="transformers"` for architectures Transformers doesn't have (@lucamotz, #69955). ([#69955](https://github.com/vllm-project/vllm/pull/69955))
- **[Refactor]** Extract shared _LazyEngineFactory base class (@aoshen02, #69926). ([#69926](https://github.com/vllm-project/vllm/pull/69926))
- **[Qwen4Exp]** Keep QSA cache layouts consistent across prefill and decode (@peakcrosser7, #69882). ([#69882](https://github.com/vllm-project/vllm/pull/69882))
- **[Transformers backend]** Splice the fused MoE into the MoE block's traced forward (@hmellor, #69868). ([#69868](https://github.com/vllm-project/vllm/pull/69868))
- **[Rust Frontend]** Echo null logprobs for prompt tokens the engine never scored (@BugenZhao, #69865). ([#69865](https://github.com/vllm-project/vllm/pull/69865))
- **[Rust Frontend]** Export vllm:nixl_num_declined_expired_reads (@BugenZhao, #69863). ([#69863](https://github.com/vllm-project/vllm/pull/69863))
- **[Rust Frontend]** Count vllm:num_preemptions from scheduler stats (@BugenZhao, #69862). ([#69862](https://github.com/vllm-project/vllm/pull/69862))
- **[Rust Frontend]** Export OffloadingConnector KV offload metrics (@BugenZhao, #69848). ([#69848](https://github.com/vllm-project/vllm/pull/69848))
- **[Refactor]** Make the allocator data copy a subclass hook (@floatlibai, #69828). ([#69828](https://github.com/vllm-project/vllm/pull/69828))
- **[Core]** Simplify KV cache planning (@ZJY0516, #69814). ([#69814](https://github.com/vllm-project/vllm/pull/69814))
- **[Kernel]** Bump FlashKDA to a32181e (codegen opts + 132→9 variant pruning) (@gau-nernst, #69787). ([#69787](https://github.com/vllm-project/vllm/pull/69787))
- **[CI]** Fix mypy errors in tests/v1/core and tests/v1/engine (@hmellor, #69751). ([#69751](https://github.com/vllm-project/vllm/pull/69751))
- **[Docs]** Reduce docs build size below the Read the Docs limit (@hmellor, #69729). ([#69729](https://github.com/vllm-project/vllm/pull/69729))
- **[Kernel]** Keep L1::no_allocate on CuTeDSL GEMM epilogue stores (@gau-nernst, #69698). ([#69698](https://github.com/vllm-project/vllm/pull/69698))
- **[Transformers backend]** Detect MLA from the latent shape and support Youtu-LLM (@hmellor, #69689). ([#69689](https://github.com/vllm-project/vllm/pull/69689))
- **[Transformers backend]** Keep MoE gates in the dtype Transformers builds them in (@hmellor, #69673). ([#69673](https://github.com/vllm-project/vllm/pull/69673))
- **[XPU]** add spec decode UT (@yma11, #69653). ([#69653](https://github.com/vllm-project/vllm/pull/69653))
- **[Rust Frontend]** Enforce --max-num-queued-reqs and --max-num-queued-tokens (@chenzl25, #69640). ([#69640](https://github.com/vllm-project/vllm/pull/69640))
- **[Perf]** Find GLM-4.7 tool-call arguments in linear time (@vMaroon, #69637). ([#69637](https://github.com/vllm-project/vllm/pull/69637))
- **[Perf]** Skip streaming argument deltas in a single-pass parse (@vMaroon, #69636). ([#69636](https://github.com/vllm-project/vllm/pull/69636))
- **[XPU]** Enable XPU graph mode for 6 recipes (@zhenwei-intel, #69605). ([#69605](https://github.com/vllm-project/vllm/pull/69605))
- **[Rust Frontend]** Bound token-ID prompts by the model vocab unless they carry multimodal inputs (@BugenZhao, #69602). ([#69602](https://github.com/vllm-project/vllm/pull/69602))
- **[Rust Frontend]** Parse Mistral v11+ tool calls (@BugenZhao, #69601). ([#69601](https://github.com/vllm-project/vllm/pull/69601))
- **[Rust Frontend]** Name the UTF-8 charset in SSE content types (@BugenZhao, #69600). ([#69600](https://github.com/vllm-project/vllm/pull/69600))
- **[Doc]** Fix docs build RecursionError from lazily imported torch._inductor (@AndreasKaratzas, #69580). ([#69580](https://github.com/vllm-project/vllm/pull/69580))
- **[Perf]** Add SM100 TP=2 and TP=8 skinny GEMM plans (@Johnsonms, #69529). ([#69529](https://github.com/vllm-project/vllm/pull/69529))
- **[XPU]** Skip cpu_test cases in Intel V1 kv_connector unit tests (@zhenwei-intel, #69524). ([#69524](https://github.com/vllm-project/vllm/pull/69524))
- **[Startup]** Keep Inductor and Dynamo imports off the non-compiled path (@WoosukKwon, #69520). ([#69520](https://github.com/vllm-project/vllm/pull/69520))
- **[CI]** Switch vllm-runners callers to @main reusable workflows (step 2/2) (@khluu, #69513). ([#69513](https://github.com/vllm-project/vllm/pull/69513))
- **[CI]** Add reusable workflows for vllm-runners (step 1/2) (@khluu, #69510). ([#69510](https://github.com/vllm-project/vllm/pull/69510))
- **[CI]** Enable batch invariance for OLMoE LoRA tests (@hlin99, #69509). ([#69509](https://github.com/vllm-project/vllm/pull/69509))
- **[CI]** Let auto-rebase ignore per-step ci/step statuses (@Thangnguyenvn98, #69503). ([#69503](https://github.com/vllm-project/vllm/pull/69503))
- **[Perf]** Drain the incremental lexer in linear time (@vMaroon, #69500). ([#69500](https://github.com/vllm-project/vllm/pull/69500))
- **[CI]** Don't treat a finished build left blocked by the test picker as running (@khluu, #69497). ([#69497](https://github.com/vllm-project/vllm/pull/69497))
- **[Docs]** Fix HY4 Flash IndexPool API reference warnings (@taneem-ibrahim, #69472). ([#69472](https://github.com/vllm-project/vllm/pull/69472))
- **[Bugfix]** Only inject `cohere_format` default chat-template kwarg in Cohere tokenizer mode (@NickLucche, #69468). ([#69468](https://github.com/vllm-project/vllm/pull/69468))
- **[Security]** Bound synchronous media body fetches (@jperezdealgaba, #69461). ([#69461](https://github.com/vllm-project/vllm/pull/69461))
- **[Governance]** Add Taneem Ibrahim as a pooling committer (@taneem-ibrahim, #69437). ([#69437](https://github.com/vllm-project/vllm/pull/69437))
- **[EPD]** Support metadata-only images and videos for HY4 and HY4 Flash (@grYe99, #69426). ([#69426](https://github.com/vllm-project/vllm/pull/69426))
- **[Recipe]** Update ERNIE recipe Support ERNIE 5.5 Flash Preview (@CSWYF3634076, #69425). ([#69425](https://github.com/vllm-project/vllm/pull/69425))
- **[CI]** Retry gcc-15 downloads from the Launchpad PPA in the CPU image (@khluu, #69416). ([#69416](https://github.com/vllm-project/vllm/pull/69416))
- **[Refactor]** Expose CuMemBackend allocator hook (@Ronald1995, #69412). ([#69412](https://github.com/vllm-project/vllm/pull/69412))
- **[Governance]** Add hickeyma as committer for API server (@hickeyma, #69405). ([#69405](https://github.com/vllm-project/vllm/pull/69405))
- **[Governance]** Update codeowner for wangxiyuan (@wangxiyuan, #69397). ([#69397](https://github.com/vllm-project/vllm/pull/69397))
- **[Rust Frontend]** Exclude frontend and install-time env vars from compile factors (@BugenZhao, #69383). ([#69383](https://github.com/vllm-project/vllm/pull/69383))
- **[Governance]** Add Tianyu Guo as an EPD code owner (@gty111, #69376). ([#69376](https://github.com/vllm-project/vllm/pull/69376))
- **[Doc]** Highlight HTTP-only (no vLLM import) weight updates in training docs (@aoshen02, #69333). ([#69333](https://github.com/vllm-project/vllm/pull/69333))
- **[Doc]** Fix relative example links in docs/training/weight_updates/engines (@aoshen02, #69300). ([#69300](https://github.com/vllm-project/vllm/pull/69300))
- **[Recipe]** Inkling 2 Mini: use the nightly image (@WoosukKwon, #69296). ([#69296](https://github.com/vllm-project/vllm/pull/69296))
- **[Bugfix]** Match ignored unexpected keys after renaming (@hmellor, #69918). ([#69918](https://github.com/vllm-project/vllm/pull/69918))
- **[Bugfix]** Fix duplicate kv quant mode int enum (@Isotr0py, #69816). ([#69816](https://github.com/vllm-project/vllm/pull/69816))
- **[Bugfix]** Make vision FA3 batch invariant (@HangruiCao2000, #69774). ([#69774](https://github.com/vllm-project/vllm/pull/69774))
- **[Bugfix]** Apply the logits soft cap in place (@bogdan-petkovic, #69674). ([#69674](https://github.com/vllm-project/vllm/pull/69674))
- **[Bugfix]** Keep synchronous load blocks out of block zeroing (@gchinora, #69656). ([#69656](https://github.com/vllm-project/vllm/pull/69656))
- **[Bugfix]** Fix refits and match training video preprocessing (@TomerBN-Nvidia, #69642). ([#69642](https://github.com/vllm-project/vllm/pull/69642))
- **[Bugfix]** Include the cause in HF processor error messages (@YingxuH, #69613). ([#69613](https://github.com/vllm-project/vllm/pull/69613))
- **[Bugfix]** Allow only the Omni shared span among overlapping multimodal placeholders (@BugenZhao, #69604). ([#69604](https://github.com/vllm-project/vllm/pull/69604))
- **[Bugfix]** Avoid ThreadPoolExecutor(wait=True) deadlock on exception in ShardedRDTTrainerWeightTransferEngine (@aoshen02, #69589). ([#69589](https://github.com/vllm-project/vllm/pull/69589))
- **[Bugfix]** Keep host-only renderer, timeout, and recovery fields out of compile cache key (@matteso1, #69475). ([#69475](https://github.com/vllm-project/vllm/pull/69475))
- **[Bugfix]** Fix race in in-place LSE merge of chunked context (@stefankoncarevic, #69433). ([#69433](https://github.com/vllm-project/vllm/pull/69433))
- **[Bugfix]** Fix KV cache planning for pipeline forwards (@hlin99, #69428). ([#69428](https://github.com/vllm-project/vllm/pull/69428))
- **[Bugfix]** Let Mooncake consumers encode requests without EC params locally (@gty111, #69366). ([#69366](https://github.com/vllm-project/vllm/pull/69366))
- **[Bugfix]** Preserve Clef SystemOne probabilities with raw pooling outputs (@taneem-ibrahim, #69329). ([#69329](https://github.com/vllm-project/vllm/pull/69329))
- **[Bugfix]** Stream long Inkling tool arguments without re-parsing (@MedUnes, #69297). ([#69297](https://github.com/vllm-project/vllm/pull/69297))
- **[Bugfix]** Respect root_path in elastic EP scaling middleware (@rishabhsai, #69285). ([#69285](https://github.com/vllm-project/vllm/pull/69285))

**Key Feature Gates / API Identifiers**: `nemotron_nas`, `model_impl="transformers"`, `cohere_format`