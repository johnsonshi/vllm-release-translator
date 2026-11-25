# What's New in vLLM Last Week in VLLM (Week Ending 2026-11-19)

## High-Level Explanation
vLLM Last Week in VLLM (Week Ending 2026-11-19) focuses on Multi-Vendor Accelerator Scaling, Low-Precision Quantization Kernels, and Next-Gen Speculative Decoding. For operators, this release translates 100 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.

## 1. What Are the High-Level Changes?
- **Multi-Vendor Accelerator Scaling**: Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code.
- **Low-Precision Quantization Kernels**: Improves low-precision quantization kernels for 100b–1t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput.
- **Next-Gen Speculative Decoding**: Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth.
- **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend**: Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet.
- **Disaggregated Serving**: Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore.

## 2. Who Benefits? (Models, GPUs & Your Bill)
| Workload / Team | Models / Services | GPUs / Hardware | Practical Impact |
|---|---|---|---|
| **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** | Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds | AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU | Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code |
| **Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)** | 100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit | NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X | Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput |
| **Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)** | Interactive coding assistants, agent loops, and low-batch-size real-time inference | NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners | Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth |
| **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** | Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters | Standard single-node and multi-node GPU inference pools | Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet |
| **Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore** | Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients | Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways | Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore |
| **CI Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |
| **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** | Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1) | NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters | Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens |

## 3. What Does the Jargon Mean?
- **Extensible KV Cache**: Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction. Why it matters: Unlocks 20–55% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes.
- **Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)**: Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass. Why it matters: Boosts per-user token generation speed (interactivity/TPOT) by 1.4x–2.5x without changing output quality.
- **MLA & Sparse-MLA (Multi-head Latent Attention)**: An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing. Why it matters: Slashes KV cache memory footprint on long contexts (32K–128K+), enabling far larger batch sizes per GPU.
- **NVFP4 / MXFP4 / FP8 Quantization**: 4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores. Why it matters: Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks.
- **P/D Disaggregation (Prefill/Decode Split & NIXL)**: Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL. Why it matters: Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs.
- **DCP & PCP (Decode / Prefill Context Parallelism)**: Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP). Why it matters: Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K–1M token agentic prompts.
- **MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)**: Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs. Why it matters: Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU.
- **Tiered KV Offloading & Prefix Caching**: Evicting and reusing computed KV cache blocks across GPU HBM, host CPU DRAM, local NVMe, or shared object storage instead of recomputing shared system prompts. Why it matters: Dramatically lowers prefill compute cost and TTFT for multi-turn chat and agent workloads that share long context prefixes.

## 4. Should I Upgrade?
**Verdict**: UPGRADE WITH CONFIG CHECK — High-ROI throughput/stability gains, but review breaking flag/API removals first
- **Before You Upgrade**: Include the cause in HF processor error messages -> Action: Included in weekly merge #69613 (2026-11-24). ([#69613](https://github.com/vllm-project/vllm/pull/69613))
- **Before You Upgrade**: Avoid ThreadPoolExecutor(wait=True) deadlock on exception in ShardedRDTTrainerWeightTransferEngine -> Action: Included in weekly merge #69589 (2026-11-24). ([#69589](https://github.com/vllm-project/vllm/pull/69589))
- **Before You Upgrade**: Keep host-only renderer, timeout, and recovery fields out of compile cache key -> Action: Included in weekly merge #69475 (2026-11-24). ([#69475](https://github.com/vllm-project/vllm/pull/69475))
- **Before You Upgrade**: Only inject `cohere_format` default chat-template kwarg in Cohere tokenizer mode -> Action: Included in weekly merge #69468 (2026-11-23). ([#69468](https://github.com/vllm-project/vllm/pull/69468))
- **Before You Upgrade**: Keep MXFP8 linear weights in FP8 on SM90 at TP1 -> Action: Included in weekly merge #69446 (2026-11-23). ([#69446](https://github.com/vllm-project/vllm/pull/69446))
- **Before You Upgrade**: Fix race in in-place LSE merge of chunked context -> Action: Included in weekly merge #69433 (2026-11-23). ([#69433](https://github.com/vllm-project/vllm/pull/69433))
- **Before You Upgrade**: Fix indexer prefill logits lifetime and fused chunk planning -> Action: Included in weekly merge #69332 (2026-11-24). ([#69332](https://github.com/vllm-project/vllm/pull/69332))
- **Before You Upgrade**: Respect root_path in elastic EP scaling middleware -> Action: Included in weekly merge #69285 (2026-11-23). ([#69285](https://github.com/vllm-project/vllm/pull/69285))
- **Deprecation**: Remove LM Format Enforcer structured outputs backend (@WoosukKwon, #69564). ([#69564](https://github.com/vllm-project/vllm/pull/69564))
- **Deprecation**: Deprecate the TorchAO backend (@devanshi-code18, #69066). ([#69066](https://github.com/vllm-project/vllm/pull/69066))

## 5. Technical Deep Dive (What's the Big Deal Under the Hood?)
### 1. Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU) ([#69564](https://github.com/vllm-project/vllm/pull/69564), [#69752](https://github.com/vllm-project/vllm/pull/69752), [#69749](https://github.com/vllm-project/vllm/pull/69749), [#69707](https://github.com/vllm-project/vllm/pull/69707))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.
- **Technical change**: Remove LM Format Enforcer structured outputs backend (@WoosukKwon, #69564).
- **Technical change**: DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752).
- **Technical change**: Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749).
- **Technical change**: Pool 16 decode pairs at TP8 in the mono layers test (@stefankoncarevic, #69707).
- **Operational impact**: Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code
### 2. Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming) ([#69066](https://github.com/vllm-project/vllm/pull/69066), [#69274](https://github.com/vllm-project/vllm/pull/69274), [#69483](https://github.com/vllm-project/vllm/pull/69483), [#69446](https://github.com/vllm-project/vllm/pull/69446))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.
- **Technical change**: Deprecate the TorchAO backend (@devanshi-code18, #69066).
- **Technical change**: Allow DFly on any compressed-tensors target scheme (NVFP4) (@mgoin, #69274).
- **Technical change**: Remove dead code quantizations (@yewentao256, #69483).
- **Technical change**: Keep MXFP8 linear weights in FP8 on SM90 at TP1 (@Ganto12, #69446).
- **Operational impact**: Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput
### 3. Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix) ([#69163](https://github.com/vllm-project/vllm/pull/69163), [#69182](https://github.com/vllm-project/vllm/pull/69182), [#69065](https://github.com/vllm-project/vllm/pull/69065))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.
- **Technical change**: Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119 (@seungrokj, #69163).
- **Technical change**: Kimi-K3.1-Pro: move the GB300 AgentX presets to the released DSpark draft, align with InferenceX#5109 (@mispa-ms, #69182).
- **Technical change**: Faster fused CUDA MTP decode for 16-bit recurrent state (@gau-nernst, #69065).
- **Operational impact**: Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth
### 4. Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend ([#69695](https://github.com/vllm-project/vllm/pull/69695), [#69683](https://github.com/vllm-project/vllm/pull/69683), [#69087](https://github.com/vllm-project/vllm/pull/69087), [#69697](https://github.com/vllm-project/vllm/pull/69697))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.
- **Technical change**: Apply checkpoint conversions that split a tensor (@hmellor, #69695).
- **Technical change**: Support OmniASR via the Transformers backend (@El-euchidali, #69683).
- **Technical change**: Migrate ERNIE 4.5 to Transformers backend (@Remarkable911, #69087).
- **Technical change**: Remove synthetic LoRA model tests (@jeejeelee, #69697).
- **Operational impact**: Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet
### 5. Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore ([#69566](https://github.com/vllm-project/vllm/pull/69566), [#69401](https://github.com/vllm-project/vllm/pull/69401), [#69598](https://github.com/vllm-project/vllm/pull/69598), [#69332](https://github.com/vllm-project/vllm/pull/69332))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.
- **Technical change**: Parse every checkpoint JSON file like Python's json (@BugenZhao, #69566).
- **Technical change**: Write only the used FlashInfer prefill checkpoint states (@gau-nernst, #69401).
- **Technical change**: Remove the phi4_mini_json tool parser (@BugenZhao, #69598).
- **Technical change**: Fix indexer prefill logits lifetime and fused chunk planning (@Heisenberg-Yin, #69332).
- **Operational impact**: Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore
### 6. CI Enhancements ([#69693](https://github.com/vllm-project/vllm/pull/69693), [#69751](https://github.com/vllm-project/vllm/pull/69751), [#69513](https://github.com/vllm-project/vllm/pull/69513), [#69510](https://github.com/vllm-project/vllm/pull/69510))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating ci enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.
- **Technical change**: Run (H200) EC Filesystem Tiering on a 35GB MIG slice (@Thangnguyenvn98, #69693).
- **Technical change**: Fix mypy errors in tests/v1/core and tests/v1/engine (@hmellor, #69751).
- **Technical change**: Switch vllm-runners callers to @main reusable workflows (step 2/2) (@khluu, #69513).
- **Technical change**: Add reusable workflows for vllm-runners (step 1/2) (@khluu, #69510).
- **Operational impact**: Operational reliability and lower maintenance toil

### Weekly / Patch Merge Pulse
- `2026-11-25` [Misc] Remove remaining xformers references ([#69794](https://github.com/vllm-project/vllm/pull/69794)) by @WoosukKwon
- `2026-11-24` [ROCm][Docs] DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 ([#69752](https://github.com/vllm-project/vllm/pull/69752)) by @seungrokj
- `2026-11-24` [CI] Fix mypy errors in tests/v1/core and tests/v1/engine ([#69751](https://github.com/vllm-project/vllm/pull/69751)) by @hmellor
- `2026-11-24` [Recipe] Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 ([#69749](https://github.com/vllm-project/vllm/pull/69749)) by @seungrokj
- `2026-11-25` [Docs] Reduce docs build size below the Read the Docs limit ([#69729](https://github.com/vllm-project/vllm/pull/69729)) by @hmellor
- `2026-11-25` [CI][ROCm][DSv4.1] Pool 16 decode pairs at TP8 in the mono layers test ([#69707](https://github.com/vllm-project/vllm/pull/69707)) by @stefankoncarevic
- `2026-11-24` [Core] Remove dead pcp_world_size plumbing from KV cache managers ([#69706](https://github.com/vllm-project/vllm/pull/69706)) by @ZJY0516
- `2026-11-24` [Model] Decouple Afmoe, Jamba and IQuestLoopCoder from llama.py ([#69703](https://github.com/vllm-project/vllm/pull/69703)) by @vyomakesh0728

## 6. Where's the Proof?
- **ROCm** ([#69752](https://github.com/vllm-project/vllm/pull/69752)): DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195.
- **Kernel** ([#69698](https://github.com/vllm-project/vllm/pull/69698)): Keep L1::no_allocate on CuTeDSL GEMM epilogue stores.
- **Transformers backend** ([#69689](https://github.com/vllm-project/vllm/pull/69689)): Detect MLA from the latent shape and support Youtu-LLM.
- **Perf** ([#69637](https://github.com/vllm-project/vllm/pull/69637)): Find GLM-4.7 tool-call arguments in linear time.
- **Perf** ([#69636](https://github.com/vllm-project/vllm/pull/69636)): Skip streaming argument deltas in a single-pass parse.
- **Perf** ([#69529](https://github.com/vllm-project/vllm/pull/69529)): Add SM100 TP=2 and TP=8 skinny GEMM plans.
- **Perf** ([#69500](https://github.com/vllm-project/vllm/pull/69500)): Drain the incremental lexer in linear time.
- **Docs** ([#69472](https://github.com/vllm-project/vllm/pull/69472)): Fix HY4 Flash IndexPool API reference warnings.
- **Bugfix** ([#69433](https://github.com/vllm-project/vllm/pull/69433)): Fix race in in-place LSE merge of chunked context.
- **EPD** ([#69426](https://github.com/vllm-project/vllm/pull/69426)): Support metadata-only images and videos for HY4 and HY4 Flash.
- **ROCm** ([#69752](https://github.com/vllm-project/vllm/pull/69752)): DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752).
- **Recipe** ([#69749](https://github.com/vllm-project/vllm/pull/69749)): Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749).
- **Recipe** ([#69163](https://github.com/vllm-project/vllm/pull/69163)): Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119 (@seungrokj, #69163).

### Complete Feature Graduation & Enhancement Rollup
- **[Deprecation]** Remove LM Format Enforcer structured outputs backend (@WoosukKwon, #69564). ([#69564](https://github.com/vllm-project/vllm/pull/69564))
- **[Deprecation]** Deprecate the TorchAO backend (@devanshi-code18, #69066). ([#69066](https://github.com/vllm-project/vllm/pull/69066))
- **[ROCm]** DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752). ([#69752](https://github.com/vllm-project/vllm/pull/69752))
- **[Recipe]** Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749). ([#69749](https://github.com/vllm-project/vllm/pull/69749))
- **[Recipe]** Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119 (@seungrokj, #69163). ([#69163](https://github.com/vllm-project/vllm/pull/69163))
- **[CI]** Pool 16 decode pairs at TP8 in the mono layers test (@stefankoncarevic, #69707). ([#69707](https://github.com/vllm-project/vllm/pull/69707))
- **[Transformers backend]** Apply checkpoint conversions that split a tensor (@hmellor, #69695). ([#69695](https://github.com/vllm-project/vllm/pull/69695))
- **[CI]** Run (H200) EC Filesystem Tiering on a 35GB MIG slice (@Thangnguyenvn98, #69693). ([#69693](https://github.com/vllm-project/vllm/pull/69693))
- **[Rust Frontend]** Parse every checkpoint JSON file like Python's json (@BugenZhao, #69566). ([#69566](https://github.com/vllm-project/vllm/pull/69566))
- **[Perf]** Write only the used FlashInfer prefill checkpoint states (@gau-nernst, #69401). ([#69401](https://github.com/vllm-project/vllm/pull/69401))
- **[CI]** Spawn the GPU memory wait worker (@RuibinCheung, #69374). ([#69374](https://github.com/vllm-project/vllm/pull/69374))
- **[Perf]** Use smaller tiles in the prefix_prefill kernel on RDNA (ROCM_ATTN prefill) (@lijipeng787, #69321). ([#69321](https://github.com/vllm-project/vllm/pull/69321))
- **[XPU]** Support sequence parallelism with pipeline parallelism (@chaojun-zhang, #69314). ([#69314](https://github.com/vllm-project/vllm/pull/69314))
- **[Spec Decode]** Allow DFly on any compressed-tensors target scheme (NVFP4) (@mgoin, #69274). ([#69274](https://github.com/vllm-project/vllm/pull/69274))
- **[Recipe]** Kimi-K3.1-Pro: B300 PD preset on kimi-k31-mc-f4c9618, align with InferenceX#5175 (@mispa-ms, #69264). ([#69264](https://github.com/vllm-project/vllm/pull/69264))
- **[Recipe]** Kimi-K3.1-Pro: move the GB300 AgentX presets to the released DSpark draft, align with InferenceX#5109 (@mispa-ms, #69182). ([#69182](https://github.com/vllm-project/vllm/pull/69182))
- **[ROCm]** Fix precision loss in asymmetric int8 linear layers on ROCm (@rasmith, #69085). ([#69085](https://github.com/vllm-project/vllm/pull/69085))
- **[Kernel]** Faster fused CUDA MTP decode for 16-bit recurrent state (@gau-nernst, #69065). ([#69065](https://github.com/vllm-project/vllm/pull/69065))
- **[ROCm]** Cache a PR's ROCm base image automatically before merge (@AndreasKaratzas, #69056). ([#69056](https://github.com/vllm-project/vllm/pull/69056))
- **[Model]** Decouple Afmoe, Jamba and IQuestLoopCoder from llama.py (@vyomakesh0728, #69703). ([#69703](https://github.com/vllm-project/vllm/pull/69703))
- **[Model]** Support OmniASR via the Transformers backend (@El-euchidali, #69683). ([#69683](https://github.com/vllm-project/vllm/pull/69683))
- **[Model]** Migrate ERNIE 4.5 to Transformers backend (@Remarkable911, #69087). ([#69087](https://github.com/vllm-project/vllm/pull/69087))
- **[Misc]** Remove remaining xformers references (@WoosukKwon, #69794). ([#69794](https://github.com/vllm-project/vllm/pull/69794))
- **[Core]** Remove dead pcp_world_size plumbing from KV cache managers (@ZJY0516, #69706). ([#69706](https://github.com/vllm-project/vllm/pull/69706))
- **[CI/Build]** Remove synthetic LoRA model tests (@jeejeelee, #69697). ([#69697](https://github.com/vllm-project/vllm/pull/69697))
- **[Rust Frontend]** Remove the phi4_mini_json tool parser (@BugenZhao, #69598). ([#69598](https://github.com/vllm-project/vllm/pull/69598))
- **[Refactor]** Remove dead code quantizations (@yewentao256, #69483). ([#69483](https://github.com/vllm-project/vllm/pull/69483))
- **[Cleanup]** Bump ROCm gfx1250 to torch 2.12 and remove workarounds for torch <= 2.12 (@WoosukKwon, #69572). ([#69572](https://github.com/vllm-project/vllm/pull/69572))
- **[Bugfix]** Keep MXFP8 linear weights in FP8 on SM90 at TP1 (@Ganto12, #69446). ([#69446](https://github.com/vllm-project/vllm/pull/69446))
- **[Bugfix]** Fix indexer prefill logits lifetime and fused chunk planning (@Heisenberg-Yin, #69332). ([#69332](https://github.com/vllm-project/vllm/pull/69332))
- **[Bugfix]** Normalize the legacy Qwen3-ASR text config alias (@pk954061458, #69226). ([#69226](https://github.com/vllm-project/vllm/pull/69226))
- **[Bugfix]** Fix ROCm OCR preemption logit drift with DeepEncoder GEMM (@gty111, #69108). ([#69108](https://github.com/vllm-project/vllm/pull/69108))
- **[CI]** Fix mypy errors in tests/v1/core and tests/v1/engine (@hmellor, #69751). ([#69751](https://github.com/vllm-project/vllm/pull/69751))
- **[Docs]** Reduce docs build size below the Read the Docs limit (@hmellor, #69729). ([#69729](https://github.com/vllm-project/vllm/pull/69729))
- **[Kernel]** Keep L1::no_allocate on CuTeDSL GEMM epilogue stores (@gau-nernst, #69698). ([#69698](https://github.com/vllm-project/vllm/pull/69698))
- **[Transformers backend]** Detect MLA from the latent shape and support Youtu-LLM (@hmellor, #69689). ([#69689](https://github.com/vllm-project/vllm/pull/69689))
- **[Transformers backend]** Keep MoE gates in the dtype Transformers builds them in (@hmellor, #69673). ([#69673](https://github.com/vllm-project/vllm/pull/69673))
- **[XPU]** add spec decode UT (@yma11, #69653). ([#69653](https://github.com/vllm-project/vllm/pull/69653))
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
- **[Doc]** Reorganize docs/training/ into weight_updates and rollout_artifacts (@aoshen02, #69248). ([#69248](https://github.com/vllm-project/vllm/pull/69248))
- **[LoRA]** Add private worker-local tensor adapter loading (@jeejeelee, #69229). ([#69229](https://github.com/vllm-project/vllm/pull/69229))
- **[Perf]** Run the fp32 lm_head through torch.mm(out_dtype=float32) on XPU (@mgaruccio, #69186). ([#69186](https://github.com/vllm-project/vllm/pull/69186))
- **[Perf]** Vectorize per-token-head KV tile loads in Triton attention (@Jeremiah-HL, #69170). ([#69170](https://github.com/vllm-project/vllm/pull/69170))
- **[Perf]** Improve small M GEMM on 5090 (sm120) (@gau-nernst, #69168). ([#69168](https://github.com/vllm-project/vllm/pull/69168))
- **[CI]** Allow Gemma3n GPU sync on older Transformers (@hlin99, #69140). ([#69140](https://github.com/vllm-project/vllm/pull/69140))
- **[Perf]** Use varlen attention in MiniCPM-V vision encoder (@YunzhuLu, #69136). ([#69136](https://github.com/vllm-project/vllm/pull/69136))
- **[Perf]** Fuse the prefill causal conv1d + post-conv prep into one CUDA kernel (@gau-nernst, #69135). ([#69135](https://github.com/vllm-project/vllm/pull/69135))
- **[CI]** Use platform device in M-RoPE prompt embeds test (@hlin99, #69134). ([#69134](https://github.com/vllm-project/vllm/pull/69134))
- **[CI]** Bump Transformers version to 5.24.1 (@hmellor, #69129). ([#69129](https://github.com/vllm-project/vllm/pull/69129))
- **[Perf]** Small NVIDIA-path wins: HC expand via cat, GDN ba overlap, fused HC mix from M=48 (@gau-nernst, #69122). ([#69122](https://github.com/vllm-project/vllm/pull/69122))
- **[Doc]** Add vLLM security review skill (@jperezdealgaba, #69101). ([#69101](https://github.com/vllm-project/vllm/pull/69101))
- **[Security]** Bound media preprocessing per prompt (@jperezdealgaba, #69098). ([#69098](https://github.com/vllm-project/vllm/pull/69098))
- **[Benchmark]** Time real server starts in vllm bench startup (--serve-cmd) (@matteso1, #69076). ([#69076](https://github.com/vllm-project/vllm/pull/69076))
- **[Frontend]** Default --renderer-num-workers to 4 for the async renderer (@arpera, #69041). ([#69041](https://github.com/vllm-project/vllm/pull/69041))
- **[Recipe]** Inkling 2 Mini: serve the full 1M context on one GPU (@WoosukKwon, #69039). ([#69039](https://github.com/vllm-project/vllm/pull/69039))
- **[Bugfix]** Include the cause in HF processor error messages (@YingxuH, #69613). ([#69613](https://github.com/vllm-project/vllm/pull/69613))
- **[Bugfix]** Avoid ThreadPoolExecutor(wait=True) deadlock on exception in ShardedRDTTrainerWeightTransferEngine (@aoshen02, #69589). ([#69589](https://github.com/vllm-project/vllm/pull/69589))
- **[Bugfix]** Keep host-only renderer, timeout, and recovery fields out of compile cache key (@matteso1, #69475). ([#69475](https://github.com/vllm-project/vllm/pull/69475))
- **[Bugfix]** Fix race in in-place LSE merge of chunked context (@stefankoncarevic, #69433). ([#69433](https://github.com/vllm-project/vllm/pull/69433))
- **[Bugfix]** Respect root_path in elastic EP scaling middleware (@rishabhsai, #69285). ([#69285](https://github.com/vllm-project/vllm/pull/69285))
- **[Bugfix]** Fix /classify for per-position seq-cls heads on the Transformers backend (@KathanSheth, #69196). ([#69196](https://github.com/vllm-project/vllm/pull/69196))
- **[Bugfix]** Restore HY4 Flash CUDA platform checks (@hlin99, #69193). ([#69193](https://github.com/vllm-project/vllm/pull/69193))
- **[Bugfix]** Normalize native GTE positional embedding configuration (@hlin99, #69145). ([#69145](https://github.com/vllm-project/vllm/pull/69145))
- **[Bugfix]** Eliminate no-op store jobs and inflated write metrics (@waizuichougou, #69132). ([#69132](https://github.com/vllm-project/vllm/pull/69132))
- **[Bugfix]** Preserve reused ARC prefixes during running-request eviction (@waizuichougou, #69110). ([#69110](https://github.com/vllm-project/vllm/pull/69110))
- **[Bugfix]** Accept NumPy images and PIL frame videos in Muse Spark Open (@yarikama, #69099). ([#69099](https://github.com/vllm-project/vllm/pull/69099))
- **[Bugfix]** Convert PIL video frames to RGB like PIL images (@yarikama, #69089). ([#69089](https://github.com/vllm-project/vllm/pull/69089))
- **[Bugfix]** Return 400 for unreadable embedding payloads (@my-git9, #69073). ([#69073](https://github.com/vllm-project/vllm/pull/69073))
- **[Bugfix]** Accept torch.Tensor videos in vLLM's own HF processors (@yarikama, #69052). ([#69052](https://github.com/vllm-project/vllm/pull/69052))
- **[Bugfix]** Store the chunk containing a partial-tail CPU hit (@nvisional, #69048). ([#69048](https://github.com/vllm-project/vllm/pull/69048))

**Key Feature Gates / API Identifiers**: `cohere_format`