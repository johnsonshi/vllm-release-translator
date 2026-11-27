# What's New in vLLM Last Week in VLLM (Week Ending 2026-11-19)

## High-Level Explanation
vLLM Last Week in VLLM (Week Ending 2026-11-19) focuses on Multi-Vendor Accelerator Scaling, Frontier MoE & Sparse-MLA Speedups, and Model Enhancements. For operators, this release translates 100 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.

## 1. What Are the High-Level Changes?
- **Multi-Vendor Accelerator Scaling**: Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code.
- **Frontier MoE & Sparse-MLA Speedups**: Improves frontier moe & sparse-mla speedups for frontier mixture-of-experts (moe) reasoning and agentic models (deepseek-v4/v4.1, glm-5.3, kimi-k3/k3.1, minimax-m3.1) running on nvidia blackwell (gb200/gb300/b200), hopper (h100/h200), and multi-node expert parallel (ep) clusters, delivering delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens.
- **Model Enhancements**: Improves model enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil.
- **Low-Precision Quantization Kernels**: Improves low-precision quantization kernels for 100b–1t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput.
- **Model Runner V2**: Improves model runner v2 for all production gpu deployments, latency-sensitive streaming apps, and custom logits processors running on all cuda and rocm gpu fleets running vllm's v2 execution engine, delivering cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3–15% while simplifying engine maintenance.

## 2. Who Benefits? (Models, GPUs & Your Bill)
| Workload / Team | Models / Services | GPUs / Hardware | Practical Impact |
|---|---|---|---|
| **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** | Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds | AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU | Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code |
| **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** | Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1) | NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters | Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens |
| **Model Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |
| **Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)** | 100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit | NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X | Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput |
| **Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs** | All production GPU deployments, latency-sensitive streaming apps, and custom logits processors | All CUDA and ROCm GPU fleets running vLLM's V2 execution engine | Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3–15% while simplifying engine maintenance |
| **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** | Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters | Standard single-node and multi-node GPU inference pools | Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet |
| **Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore** | Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients | Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways | Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore |

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
- **Before You Upgrade**: Read the conv cache in short_conv prefill tiles that end in padding -> Action: Included in weekly merge #70246 (2026-11-27). ([#70246](https://github.com/vllm-project/vllm/pull/70246))
- **Before You Upgrade**: Pass is_ultraquant_run in automatic attention backend selection -> Action: Included in weekly merge #70169 (2026-11-26). ([#70169](https://github.com/vllm-project/vllm/pull/70169))
- **Before You Upgrade**: Preserve per-video processor kwargs during encoder fan-out -> Action: Included in weekly merge #70167 (2026-11-27). ([#70167](https://github.com/vllm-project/vllm/pull/70167))
- **Before You Upgrade**: Keep the BOS that the HF processor prepends -> Action: Included in weekly merge #70116 (2026-11-26). ([#70116](https://github.com/vllm-project/vllm/pull/70116))
- **Before You Upgrade**: Don't split checkpoint tensors of skipped modules -> Action: Included in weekly merge #70076 (2026-11-26). ([#70076](https://github.com/vllm-project/vllm/pull/70076))
- **Before You Upgrade**: Fix Mamba decode resume caching a block that holds a later state -> Action: Included in weekly merge #70068 (2026-11-26). ([#70068](https://github.com/vllm-project/vllm/pull/70068))
- **Before You Upgrade**: Avoid GPU<->CPU sync in eager _build_image_span -> Action: Included in weekly merge #70067 (2026-11-27). ([#70067](https://github.com/vllm-project/vllm/pull/70067))
- **Before You Upgrade**: Revert "Return pending work, events and stats from on_schedule_end (#68962)" -> Action: Included in weekly merge #70063 (2026-11-26). ([#70063](https://github.com/vllm-project/vllm/pull/70063))
- **Deprecation**: Deprecate `cudagraph_copy_inputs` and remove the compiler-managed input copy (@hmellor, #69675). ([#69675](https://github.com/vllm-project/vllm/pull/69675))
- **Security**: Restrict inline request templates in Cohere serving (@jperezdealgaba, #69969). ([#69969](https://github.com/vllm-project/vllm/pull/69969))

## 5. Technical Deep Dive (What's the Big Deal Under the Hood?)
### 1. Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU) ([#69752](https://github.com/vllm-project/vllm/pull/69752), [#69749](https://github.com/vllm-project/vllm/pull/69749), [#70169](https://github.com/vllm-project/vllm/pull/70169), [#70155](https://github.com/vllm-project/vllm/pull/70155))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.
- **Technical change**: DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752).
- **Technical change**: Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749).
- **Technical change**: Pass is_ultraquant_run in automatic attention backend selection (@SRKRZ23, #70169).
- **Technical change**: Speed up the block-quant reference matmul in kernel tests (@stefankoncarevic, #70155).
- **Operational impact**: Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code
### 2. Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3) ([#69624](https://github.com/vllm-project/vllm/pull/69624), [#70004](https://github.com/vllm-project/vllm/pull/70004), [#69669](https://github.com/vllm-project/vllm/pull/69669), [#69625](https://github.com/vllm-project/vllm/pull/69625))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.
- **Technical change**: Kimi-K3.1-Pro: serve the model card's sampling defaults; Kimi-K3 / K3.1-Pro: opt-in strict tool calls (@AndreasKaratzas, #69624).
- **Technical change**: fp8_ds_mla with sinks, ShardQ and iHC sequence parallelism on ROCm (@AndreasKaratzas, #70004).
- **Technical change**: Specialized decode: compile each kernel once, only for captured sizes (@mgoin, #69669).
- **Technical change**: Log the SiTUv2 MoE activation mode and correct the recipe note (@AndreasKaratzas, #69625).
- **Operational impact**: Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens
### 3. Model Enhancements ([#70133](https://github.com/vllm-project/vllm/pull/70133), [#69929](https://github.com/vllm-project/vllm/pull/69929), [#69780](https://github.com/vllm-project/vllm/pull/69780), [#69703](https://github.com/vllm-project/vllm/pull/69703))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating model enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.
- **Technical change**: Remove DBRX (@hmellor, #70133).
- **Technical change**: Remove TeleFLM (@vyomakesh0728, #69929).
- **Technical change**: HY4: Use the fused iHC boundary op on all paths and fuse HY4 Flash q/kv-a projections (@jeejeelee, #69780).
- **Technical change**: Decouple Afmoe, Jamba and IQuestLoopCoder from llama.py (@vyomakesh0728, #69703).
- **Operational impact**: Operational reliability and lower maintenance toil
### 4. Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming) ([#70187](https://github.com/vllm-project/vllm/pull/70187), [#69738](https://github.com/vllm-project/vllm/pull/69738), [#70214](https://github.com/vllm-project/vllm/pull/70214))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.
- **Technical change**: Split-K, fused tiny-M slots, PDL, and cvt.rn.bf16x2.e4m3x2 for Blackwell FP8 QSA (@gau-nernst, #70187).
- **Technical change**: Nemotron Shortcut SDSA: convert NVFP4 K/V once per request by key position (@danielafrimi, #69738).
- **Technical change**: Apply an online quantization target to the lm_head (@avifenesh, #70214).
- **Operational impact**: Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput
### 5. Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs ([#69675](https://github.com/vllm-project/vllm/pull/69675), [#69795](https://github.com/vllm-project/vllm/pull/69795))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.
- **Technical change**: Deprecate `cudagraph_copy_inputs` and remove the compiler-managed input copy (@hmellor, #69675).
- **Technical change**: Align CUDA graph capture input_ids and inputs_embeds with execute_model (@specture724, #69795).
- **Operational impact**: Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3–15% while simplifying engine maintenance
### 6. Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend ([#69726](https://github.com/vllm-project/vllm/pull/69726), [#69736](https://github.com/vllm-project/vllm/pull/69736), [#69695](https://github.com/vllm-project/vllm/pull/69695), [#69683](https://github.com/vllm-project/vllm/pull/69683))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.
- **Technical change**: Decouple `nemotron_nas` from llama (@vyomakesh0728, #69726).
- **Technical change**: SM100/SM103 skinny GEMM plans for Qwen3, Qwen3.5/3.6 MoE and Qwen3.8 decode projections (@Johnsonms, #69736).
- **Technical change**: Apply checkpoint conversions that split a tensor (@hmellor, #69695).
- **Technical change**: Support OmniASR via the Transformers backend (@El-euchidali, #69683).
- **Operational impact**: Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet

### Weekly / Patch Merge Pulse
- `2026-11-27` [Bugfix][Inkling2] Read the conv cache in short_conv prefill tiles that end in padding ([#70246](https://github.com/vllm-project/vllm/pull/70246)) by @gau-nernst
- `2026-11-27` [Frontend] Honor return_documents in rerank responses ([#70216](https://github.com/vllm-project/vllm/pull/70216)) by @bnkaiteam
- `2026-11-27` [Model][Qwen4Exp] Apply an online quantization target to the lm_head ([#70214](https://github.com/vllm-project/vllm/pull/70214)) by @avifenesh
- `2026-11-27` [LoRA] Add --lora-split-k-reduction for LoRA BI ([#70197](https://github.com/vllm-project/vllm/pull/70197)) by @jeejeelee
- `2026-11-27` [Perf][Qwen4Exp] Split-K, fused tiny-M slots, PDL, and cvt.rn.bf16x2.e4m3x2 for Blackwell FP8 QSA ([#70187](https://github.com/vllm-project/vllm/pull/70187)) by @gau-nernst
- `2026-11-26` [Perf][DCP] Size sparse-indexer decode logits by the DCP-local context ([#70178](https://github.com/vllm-project/vllm/pull/70178)) by @SherifWaly
- `2026-11-26` [ROCm][Bugfix] Pass is_ultraquant_run in automatic attention backend selection ([#70169](https://github.com/vllm-project/vllm/pull/70169)) by @SRKRZ23
- `2026-11-27` [Bugfix][EPD] Preserve per-video processor kwargs during encoder fan-out ([#70167](https://github.com/vllm-project/vllm/pull/70167)) by @grYe99

## 6. Where's the Proof?
- **Perf** ([#70187](https://github.com/vllm-project/vllm/pull/70187)): Split-K, fused tiny-M slots, PDL, and cvt.rn.bf16x2.e4m3x2 for Blackwell FP8 QSA.
- **Perf** ([#70178](https://github.com/vllm-project/vllm/pull/70178)): Size sparse-indexer decode logits by the DCP-local context.
- **CI** ([#70159](https://github.com/vllm-project/vllm/pull/70159)): Skip the global cleanup after kernel tests that skipped themselves.
- **CI** ([#70155](https://github.com/vllm-project/vllm/pull/70155)): Speed up the block-quant reference matmul in kernel tests.
- **Doc** ([#70070](https://github.com/vllm-project/vllm/pull/70070)): Make the --monokernel docstring model and hardware agnostic.
- **Kernel** ([#69787](https://github.com/vllm-project/vllm/pull/69787)): Bump FlashKDA to a32181e (codegen opts + 132→9 variant pruning).
- **Model** ([#69780](https://github.com/vllm-project/vllm/pull/69780)): HY4: Use the fused iHC boundary op on all paths and fuse HY4 Flash q/kv-a projections.
- **ROCm** ([#69752](https://github.com/vllm-project/vllm/pull/69752)): DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195.
- **Perf** ([#69738](https://github.com/vllm-project/vllm/pull/69738)): Nemotron Shortcut SDSA: convert NVFP4 K/V once per request by key position.
- **Perf** ([#69736](https://github.com/vllm-project/vllm/pull/69736)): SM100/SM103 skinny GEMM plans for Qwen3, Qwen3.5/3.6 MoE and Qwen3.8 decode projections.
- **Perf** ([#70187](https://github.com/vllm-project/vllm/pull/70187)): Split-K, fused tiny-M slots, PDL, and cvt.rn.bf16x2.e4m3x2 for Blackwell FP8 QSA (@gau-nernst, #70187).
- **ROCm** ([#69752](https://github.com/vllm-project/vllm/pull/69752)): DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752).
- **Recipe** ([#69749](https://github.com/vllm-project/vllm/pull/69749)): Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749).

### Complete Feature Graduation & Enhancement Rollup
- **[Deprecation]** Deprecate `cudagraph_copy_inputs` and remove the compiler-managed input copy (@hmellor, #69675). ([#69675](https://github.com/vllm-project/vllm/pull/69675))
- **[Perf]** Split-K, fused tiny-M slots, PDL, and cvt.rn.bf16x2.e4m3x2 for Blackwell FP8 QSA (@gau-nernst, #70187). ([#70187](https://github.com/vllm-project/vllm/pull/70187))
- **[ROCm]** DeepSeek-V4.1-Flash: MI355X AgentX TP and DP presets from InferenceX #5195 (@seungrokj, #69752). ([#69752](https://github.com/vllm-project/vllm/pull/69752))
- **[Recipe]** Kimi-K3.1-Pro: MI355X kimi-k31-020490a image (amd_kernels bridge) and FlyDSL draft attention, align with InferenceX#5196 (@seungrokj, #69749). ([#69749](https://github.com/vllm-project/vllm/pull/69749))
- **[Model]** Remove DBRX (@hmellor, #70133). ([#70133](https://github.com/vllm-project/vllm/pull/70133))
- **[Model]** Remove TeleFLM (@vyomakesh0728, #69929). ([#69929](https://github.com/vllm-project/vllm/pull/69929))
- **[Recipe]** Kimi-K3.1-Pro: serve the model card's sampling defaults; Kimi-K3 / K3.1-Pro: opt-in strict tool calls (@AndreasKaratzas, #69624). ([#69624](https://github.com/vllm-project/vllm/pull/69624))
- **[Model]** Decouple `nemotron_nas` from llama (@vyomakesh0728, #69726). ([#69726](https://github.com/vllm-project/vllm/pull/69726))
- **[Perf]** Size sparse-indexer decode logits by the DCP-local context (@SherifWaly, #70178). ([#70178](https://github.com/vllm-project/vllm/pull/70178))
- **[ROCm]** Pass is_ultraquant_run in automatic attention backend selection (@SRKRZ23, #70169). ([#70169](https://github.com/vllm-project/vllm/pull/70169))
- **[CI]** Speed up the block-quant reference matmul in kernel tests (@stefankoncarevic, #70155). ([#70155](https://github.com/vllm-project/vllm/pull/70155))
- **[ROCm]** Use an fp32 lm_head for granite4_h in test_pp_tied_word_embeddings (@stefankoncarevic, #70134). ([#70134](https://github.com/vllm-project/vllm/pull/70134))
- **[ROCm]** fp8_ds_mla with sinks, ShardQ and iHC sequence parallelism on ROCm (@AndreasKaratzas, #70004). ([#70004](https://github.com/vllm-project/vllm/pull/70004))
- **[ROCm]** Move MI300 Quantization, MoE, distributed, and batch invariance jobs to DPX (@sheralskumar, #69952). ([#69952](https://github.com/vllm-project/vllm/pull/69952))
- **[ROCm]** Make the child stack dump work on Python 3.14 (@bogdan-petkovic, #69911). ([#69911](https://github.com/vllm-project/vllm/pull/69911))
- **[Rust Frontend]** Cap Qwen3-VL videos at 32 per prompt by default (@BugenZhao, #69864). ([#69864](https://github.com/vllm-project/vllm/pull/69864))
- **[Perf]** Nemotron Shortcut SDSA: convert NVFP4 K/V once per request by key position (@danielafrimi, #69738). ([#69738](https://github.com/vllm-project/vllm/pull/69738))
- **[Perf]** SM100/SM103 skinny GEMM plans for Qwen3, Qwen3.5/3.6 MoE and Qwen3.8 decode projections (@Johnsonms, #69736). ([#69736](https://github.com/vllm-project/vllm/pull/69736))
- **[CI]** Pool 16 decode pairs at TP8 in the mono layers test (@stefankoncarevic, #69707). ([#69707](https://github.com/vllm-project/vllm/pull/69707))
- **[Transformers backend]** Apply checkpoint conversions that split a tensor (@hmellor, #69695). ([#69695](https://github.com/vllm-project/vllm/pull/69695))
- **[CI]** Run (H200) EC Filesystem Tiering on a 35GB MIG slice (@Thangnguyenvn98, #69693). ([#69693](https://github.com/vllm-project/vllm/pull/69693))
- **[Perf]** Specialized decode: compile each kernel once, only for captured sizes (@mgoin, #69669). ([#69669](https://github.com/vllm-project/vllm/pull/69669))
- **[ROCm]** Log the SiTUv2 MoE activation mode and correct the recipe note (@AndreasKaratzas, #69625). ([#69625](https://github.com/vllm-project/vllm/pull/69625))
- **[Model]** Apply an online quantization target to the lm_head (@avifenesh, #70214). ([#70214](https://github.com/vllm-project/vllm/pull/70214))
- **[KV Offload]** Prefer eviction of non-retained CPU chunks (@maithilijoshi20, #70026). ([#70026](https://github.com/vllm-project/vllm/pull/70026))
- **[Model]** HY4: Use the fused iHC boundary op on all paths and fuse HY4 Flash q/kv-a projections (@jeejeelee, #69780). ([#69780](https://github.com/vllm-project/vllm/pull/69780))
- **[Model]** Decouple Afmoe, Jamba and IQuestLoopCoder from llama.py (@vyomakesh0728, #69703). ([#69703](https://github.com/vllm-project/vllm/pull/69703))
- **[Model]** Support OmniASR via the Transformers backend (@El-euchidali, #69683). ([#69683](https://github.com/vllm-project/vllm/pull/69683))
- **[KV Offload]** Share replicated MLA KV per host (@Etelis, #69677). ([#69677](https://github.com/vllm-project/vllm/pull/69677))
- **[Model]** Enable data-parallel multimodal encoder for HY4 (@grYe99, #69676). ([#69676](https://github.com/vllm-project/vllm/pull/69676))
- **[Refactor]** Remove unused SleepModeState and uncalled capability flags (@aoshen02, #70038). ([#70038](https://github.com/vllm-project/vllm/pull/70038))
- **[Refactor]** Remove dead code in models (@yewentao256, #69975). ([#69975](https://github.com/vllm-project/vllm/pull/69975))
- **[Misc]** Remove remaining xformers references (@WoosukKwon, #69794). ([#69794](https://github.com/vllm-project/vllm/pull/69794))
- **[Core]** Remove dead pcp_world_size plumbing from KV cache managers (@ZJY0516, #69706). ([#69706](https://github.com/vllm-project/vllm/pull/69706))
- **[CI/Build]** Remove synthetic LoRA model tests (@jeejeelee, #69697). ([#69697](https://github.com/vllm-project/vllm/pull/69697))
- **[Bugfix]** Kimi K3: accept strict tool schemas with a `$ref` into their own property tree (@AndreasKaratzas, #69622). ([#69622](https://github.com/vllm-project/vllm/pull/69622))
- **[Bugfix]** Don't split checkpoint tensors of skipped modules (@lucamotz, #70076). ([#70076](https://github.com/vllm-project/vllm/pull/70076))
- **[Bugfix]** Route DeepSeek ViT cu_seqlens through the OOT attention hook (@yiz-liu, #70044). ([#70044](https://github.com/vllm-project/vllm/pull/70044))
- **[Bugfix]** Avoid importing ROCm platform in AITER W4A16 support check on non-ROCm (@zhenwei-intel, #70009). ([#70009](https://github.com/vllm-project/vllm/pull/70009))
- **[Bugfix]** Import shared host KV on every node's host leader (@Ankit1478, #69901). ([#69901](https://github.com/vllm-project/vllm/pull/69901))
- **[Bugfix]** Align CUDA graph capture input_ids and inputs_embeds with execute_model (@specture724, #69795). ([#69795](https://github.com/vllm-project/vllm/pull/69795))
- **[Bugfix]** Account for PCP size in DP supervisor device_ids (@pisceskkk, #69664). ([#69664](https://github.com/vllm-project/vllm/pull/69664))
- **[Transformers backend]** Fix `model_impl="transformers"` for architectures Transformers doesn't have (@lucamotz, #69955). ([#69955](https://github.com/vllm-project/vllm/pull/69955))
- **[Frontend]** Honor return_documents in rerank responses (@bnkaiteam, #70216). ([#70216](https://github.com/vllm-project/vllm/pull/70216))
- **[LoRA]** Add --lora-split-k-reduction for LoRA BI (@jeejeelee, #70197). ([#70197](https://github.com/vllm-project/vllm/pull/70197))
- **[CI]** Skip the global cleanup after kernel tests that skipped themselves (@stefankoncarevic, #70159). ([#70159](https://github.com/vllm-project/vllm/pull/70159))
- **[Rust Frontend]** Accept Python's inverse spellings of boolean flags (@BugenZhao, #70096). ([#70096](https://github.com/vllm-project/vllm/pull/70096))
- **[Rust Frontend]** Return empty logprobs for chat and generate requests aborted during prefill (@BugenZhao, #70095). ([#70095](https://github.com/vllm-project/vllm/pull/70095))
- **[Rust Frontend]** Bound allowed_token_ids by the model vocabulary (@BugenZhao, #70093). ([#70093](https://github.com/vllm-project/vllm/pull/70093))
- **[Rust Frontend]** Classify multimodal preprocessing errors by fault (@BugenZhao, #70092). ([#70092](https://github.com/vllm-project/vllm/pull/70092))
- **[Rust Frontend]** Type renderer refusals of the request (@BugenZhao, #70091). ([#70091](https://github.com/vllm-project/vllm/pull/70091))
- **[Rust Frontend]** Accept only OpenAI's input_audio format names (@BugenZhao, #70090). ([#70090](https://github.com/vllm-project/vllm/pull/70090))
- **[Rust Frontend]** Reject non-object function tool parameters (@BugenZhao, #70089). ([#70089](https://github.com/vllm-project/vllm/pull/70089))
- **[Doc]** Make the --monokernel docstring model and hardware agnostic (@jeejeelee, #70070). ([#70070](https://github.com/vllm-project/vllm/pull/70070))
- **[Rust Frontend]** Serve /v1/decisions with next-token reads (@chenzl25, #70031). ([#70031](https://github.com/vllm-project/vllm/pull/70031))
- **[XPU]** Raise API Server Scale Out step timeout to 60 minutes (@zhenwei-intel, #70005). ([#70005](https://github.com/vllm-project/vllm/pull/70005))
- **[CI]** Leave the shard coverage check out of /ci retry on a new commit (@lucamotz, #69996). ([#69996](https://github.com/vllm-project/vllm/pull/69996))
- **[Security]** Restrict inline request templates in Cohere serving (@jperezdealgaba, #69969). ([#69969](https://github.com/vllm-project/vllm/pull/69969))
- **[Security]** Bound Jina ranking prompt preprocessing (@jperezdealgaba, #69967). ([#69967](https://github.com/vllm-project/vllm/pull/69967))
- **[Refactor]** Extract shared _LazyEngineFactory base class (@aoshen02, #69926). ([#69926](https://github.com/vllm-project/vllm/pull/69926))
- **[Qwen4Exp]** Keep QSA cache layouts consistent across prefill and decode (@peakcrosser7, #69882). ([#69882](https://github.com/vllm-project/vllm/pull/69882))
- **[Transformers backend]** Splice the fused MoE into the MoE block's traced forward (@hmellor, #69868). ([#69868](https://github.com/vllm-project/vllm/pull/69868))
- **[Rust Frontend]** Echo null logprobs for prompt tokens the engine never scored (@BugenZhao, #69865). ([#69865](https://github.com/vllm-project/vllm/pull/69865))
- **[Rust Frontend]** Export vllm:nixl_num_declined_expired_reads (@BugenZhao, #69863). ([#69863](https://github.com/vllm-project/vllm/pull/69863))
- **[Rust Frontend]** Count vllm:num_preemptions from scheduler stats (@BugenZhao, #69862). ([#69862](https://github.com/vllm-project/vllm/pull/69862))
- **[Rust Frontend]** Count vllm:admission_rejections (@chenzl25, #69856). ([#69856](https://github.com/vllm-project/vllm/pull/69856))
- **[Security]** Reserve HF tokenizer options in chat requests (@jperezdealgaba, #69852). ([#69852](https://github.com/vllm-project/vllm/pull/69852))
- **[Rust Frontend]** Export OffloadingConnector KV offload metrics (@BugenZhao, #69848). ([#69848](https://github.com/vllm-project/vllm/pull/69848))
- **[Renderer]** Pass media_io_kwargs to renderer via prompt_extras (@noooop, #69842). ([#69842](https://github.com/vllm-project/vllm/pull/69842))
- **[Refactor]** Make the allocator data copy a subclass hook (@floatlibai, #69828). ([#69828](https://github.com/vllm-project/vllm/pull/69828))
- **[Core]** Simplify KV cache planning (@ZJY0516, #69814). ([#69814](https://github.com/vllm-project/vllm/pull/69814))
- **[Kernel]** Bump FlashKDA to a32181e (codegen opts + 132→9 variant pruning) (@gau-nernst, #69787). ([#69787](https://github.com/vllm-project/vllm/pull/69787))
- **[CI]** Fix mypy errors in tests/v1/core and tests/v1/engine (@hmellor, #69751). ([#69751](https://github.com/vllm-project/vllm/pull/69751))
- **[Perf]** Run QSA prefill steps with FlashInfer on Blackwell (@hugoabonizio, #69735). ([#69735](https://github.com/vllm-project/vllm/pull/69735))
- **[Docs]** Reduce docs build size below the Read the Docs limit (@hmellor, #69729). ([#69729](https://github.com/vllm-project/vllm/pull/69729))
- **[Kernel]** Keep L1::no_allocate on CuTeDSL GEMM epilogue stores (@gau-nernst, #69698). ([#69698](https://github.com/vllm-project/vllm/pull/69698))
- **[Transformers backend]** Detect MLA from the latent shape and support Youtu-LLM (@hmellor, #69689). ([#69689](https://github.com/vllm-project/vllm/pull/69689))
- **[Transformers backend]** Keep MoE gates in the dtype Transformers builds them in (@hmellor, #69673). ([#69673](https://github.com/vllm-project/vllm/pull/69673))
- **[XPU]** add spec decode UT (@yma11, #69653). ([#69653](https://github.com/vllm-project/vllm/pull/69653))
- **[Rust Frontend]** Enforce --max-num-queued-reqs and --max-num-queued-tokens (@chenzl25, #69640). ([#69640](https://github.com/vllm-project/vllm/pull/69640))
- **[Perf]** Find GLM-4.7 tool-call arguments in linear time (@vMaroon, #69637). ([#69637](https://github.com/vllm-project/vllm/pull/69637))
- **[Perf]** Skip streaming argument deltas in a single-pass parse (@vMaroon, #69636). ([#69636](https://github.com/vllm-project/vllm/pull/69636))
- **[Fast Start]** Add engram cpu offloading support for preload daemon (@Isotr0py, #69627). ([#69627](https://github.com/vllm-project/vllm/pull/69627))
- **[Core]** Deprioritize superseded Mamba prefix-cache states (@ZJY0516, #69626). ([#69626](https://github.com/vllm-project/vllm/pull/69626))
- **[Bugfix]** Read the conv cache in short_conv prefill tiles that end in padding (@gau-nernst, #70246). ([#70246](https://github.com/vllm-project/vllm/pull/70246))
- **[Bugfix]** Preserve per-video processor kwargs during encoder fan-out (@grYe99, #70167). ([#70167](https://github.com/vllm-project/vllm/pull/70167))
- **[Bugfix]** Keep the BOS that the HF processor prepends (@lucamotz, #70116). ([#70116](https://github.com/vllm-project/vllm/pull/70116))
- **[Bugfix]** Fix Mamba decode resume caching a block that holds a later state (@sansblues, #70068). ([#70068](https://github.com/vllm-project/vllm/pull/70068))
- **[Bugfix]** Avoid GPU<->CPU sync in eager _build_image_span (@pisceskkk, #70067). ([#70067](https://github.com/vllm-project/vllm/pull/70067))
- **[Bugfix]** Revert "Return pending work, events and stats from on_schedule_end (#68962)" (@orozery, #70063). ([#70063](https://github.com/vllm-project/vllm/pull/70063))
- **[Bugfix]** Accept "original" image detail (@JackZeng0208, #70001). ([#70001](https://github.com/vllm-project/vllm/pull/70001))
- **[Bugfix]** Match ignored unexpected keys after renaming (@hmellor, #69918). ([#69918](https://github.com/vllm-project/vllm/pull/69918))
- **[Bugfix]** Apply soft cap and scale in place in get_top_tokens (@bogdan-petkovic, #69898). ([#69898](https://github.com/vllm-project/vllm/pull/69898))
- **[Bugfix]** Reject missing draft context KV (@wangyicong52, #69870). ([#69870](https://github.com/vllm-project/vllm/pull/69870))
- **[Bugfix]** Support grouped 4D KV cache blocks (@maralbahari, #69819). ([#69819](https://github.com/vllm-project/vllm/pull/69819))
- **[Bugfix]** Fix duplicate kv quant mode int enum (@Isotr0py, #69816). ([#69816](https://github.com/vllm-project/vllm/pull/69816))
- **[Bugfix]** Make vision FA3 batch invariant (@HangruiCao2000, #69774). ([#69774](https://github.com/vllm-project/vllm/pull/69774))
- **[Bugfix]** Apply the logits soft cap in place (@bogdan-petkovic, #69674). ([#69674](https://github.com/vllm-project/vllm/pull/69674))
- **[Bugfix]** Keep synchronous load blocks out of block zeroing (@gchinora, #69656). ([#69656](https://github.com/vllm-project/vllm/pull/69656))
- **[Bugfix]** Fix refits and match training video preprocessing (@TomerBN-Nvidia, #69642). ([#69642](https://github.com/vllm-project/vllm/pull/69642))

**Key Feature Gates / API Identifiers**: `cudagraph_copy_inputs`, `nemotron_nas`, `$ref`, `model_impl="transformers"`