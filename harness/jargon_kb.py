"""
Domain knowledge base for translating low-level Kubernetes and vLLM engineering
changes into plain-English adoption decisions, jargon definitions, and
Models / GPUs / Bill impact mappings.
"""

from __future__ import annotations

import re
from typing import Any

# Plain-English jargon glossary for Kubernetes & vLLM
JARGON_GLOSSARY: dict[str, dict[str, str]] = {
    # --- Kubernetes Jargon ---
    "DRA": {
        "term": "DRA (Dynamic Resource Allocation)",
        "domain": "kubernetes",
        "meaning": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs—replacing rigid integer device plugins.",
        "why_it_matters": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks.",
    },
    "In-Place Pod Resize": {
        "term": "In-Place Pod Vertical Scaling (Resize)",
        "domain": "kubernetes",
        "meaning": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
        "why_it_matters": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers.",
    },
    "Gang Scheduling": {
        "term": "Gang Scheduling (`Workload` / `PodGroup`)",
        "domain": "kubernetes",
        "meaning": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
        "why_it_matters": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity.",
    },
    "Sidecar Containers": {
        "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
        "domain": "kubernetes",
        "meaning": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
        "why_it_matters": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive.",
    },
    "ValidatingAdmissionPolicy": {
        "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
        "domain": "kubernetes",
        "meaning": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
        "why_it_matters": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments.",
    },
    "User Namespaces": {
        "term": "Linux User Namespaces (`hostUsers: false`)",
        "domain": "kubernetes",
        "meaning": "Maps the `root` user inside a container to an unprivileged non-root UID on the host node kernel.",
        "why_it_matters": "Dramatically reduces container-escape blast radius even for legacy workloads that require running as `root` inside the container.",
    },
    "WatchList": {
        "term": "WatchList & Snapshottable Watch Cache",
        "domain": "kubernetes",
        "meaning": "Streaming object lists from `kube-apiserver` memory cache snapshots instead of assembling giant one-shot payloads from `etcd`.",
        "why_it_matters": "Slashes API server RAM spikes and protects `etcd` from OOM crashes during controller restarts on large clusters.",
    },
    "nftables": {
        "term": "nftables `kube-proxy` Backend",
        "domain": "kubernetes",
        "meaning": "A modern Linux kernel packet-filtering backend for Kubernetes Service routing that replaces legacy `iptables` linear rule chains.",
        "why_it_matters": "Cuts Service rule programming latency and CPU overhead on clusters with tens of thousands of Services.",
    },
    "PodCertificateRequest": {
        "term": "Pod Certificates (`PodCertificateRequest`)",
        "domain": "kubernetes",
        "meaning": "Built-in kubelet provisioning and rotation of X.509 mTLS identity certificates directly into Pods without third-party sidecars.",
        "why_it_matters": "Simplifies zero-trust pod-to-pod mTLS without managing complex external webhook/cert-manager plumbing.",
    },
    "HPA Scale-to-Zero": {
        "term": "HPA Scale-to-Zero (`minReplicas: 0`)",
        "domain": "kubernetes",
        "meaning": "Allows `HorizontalPodAutoscaler` to scale external/queue-driven workloads all the way down to 0 replicas when idle and wake them when queue depth rises.",
        "why_it_matters": "Directly cuts cloud compute and GPU bills for bursty batch/inference workers during off-peak hours.",
    },
    "CBOR": {
        "term": "CBOR Encoding for Kubernetes API",
        "domain": "kubernetes",
        "meaning": "Concise Binary Object Representation (RFC 8949) as a compact binary alternative to JSON for Kubernetes API client-server serialization.",
        "why_it_matters": "Reduces API server CPU spent on JSON parsing and lowers network bandwidth for custom resources (CRDs) that couldn't use Protobuf.",
    },
    "CSI": {
        "term": "CSI (Container Storage Interface)",
        "domain": "kubernetes",
        "meaning": "The standard plugin layer connecting Kubernetes PersistentVolumes to cloud block/file storage providers.",
        "why_it_matters": "Controls how fast stateful workloads attach disks, recover from node failures, and handle credentials.",
    },

    # --- vLLM Jargon ---
    "Extensible KV Cache": {
        "term": "Extensible KV Cache",
        "domain": "vllm",
        "meaning": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
        "why_it_matters": "Unlocks 20–55% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes.",
    },
    "Model Runner V2": {
        "term": "Model Runner V2 (MRV2)",
        "domain": "vllm",
        "meaning": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
        "why_it_matters": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity.",
    },
    "Speculative Decoding": {
        "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
        "domain": "vllm",
        "meaning": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
        "why_it_matters": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x–2.5x without changing output quality.",
    },
    "MLA": {
        "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
        "domain": "vllm",
        "meaning": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
        "why_it_matters": "Slashes KV cache memory footprint on long contexts (32K–128K+), enabling far larger batch sizes per GPU.",
    },
    "NVFP4": {
        "term": "NVFP4 / MXFP4 / FP8 Quantization",
        "domain": "vllm",
        "meaning": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
        "why_it_matters": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks.",
    },
    "P/D Disaggregation": {
        "term": "P/D Disaggregation (Prefill/Decode Split & NIXL)",
        "domain": "vllm",
        "meaning": "Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL.",
        "why_it_matters": "Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs.",
    },
    "DCP": {
        "term": "DCP & PCP (Decode / Prefill Context Parallelism)",
        "domain": "vllm",
        "meaning": "Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP).",
        "why_it_matters": "Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K–1M token agentic prompts.",
    },
    "MegaMoE": {
        "term": "MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)",
        "domain": "vllm",
        "meaning": "Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs.",
        "why_it_matters": "Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU.",
    },
    "CUDA Graphs": {
        "term": "Piecewise & Breakable CUDA Graphs",
        "domain": "vllm",
        "meaning": "Capturing sequences of GPU kernel launches into replayable graphs (even across dynamic control flow) so the CPU doesn't launch hundreds of tiny kernels per token.",
        "why_it_matters": "Eliminates CPU bottlenecks during decode, cutting inter-token latency (ITL) by 5–25% without long `torch.compile` warmups.",
    },
    "TTFT & TPOT": {
        "term": "TTFT (Time to First Token) & TPOT / ITL (Time Per Output Token)",
        "domain": "vllm",
        "meaning": "The two core LLM latency SLAs: TTFT measures how fast the first response token appears after a prompt; TPOT/ITL measures how fast subsequent tokens stream.",
        "why_it_matters": "Directly determines whether an AI coding agent or voice assistant feels snappy or sluggish to end users.",
    },
    "KV Offloading": {
        "term": "Tiered KV Offloading & Prefix Caching",
        "domain": "vllm",
        "meaning": "Evicting and reusing computed KV cache blocks across GPU HBM, host CPU DRAM, local NVMe, or shared object storage instead of recomputing shared system prompts.",
        "why_it_matters": "Dramatically lowers prefill compute cost and TTFT for multi-turn chat and agent workloads that share long context prefixes.",
    },
    "LibTorch Stable ABI": {
        "term": "LibTorch Stable ABI",
        "domain": "vllm",
        "meaning": "Compiling vLLM's custom C++/CUDA kernels against PyTorch's binary-stable application interface rather than internal C++ symbols.",
        "why_it_matters": "Lets you upgrade PyTorch versions or security patches without rebuilding vLLM's entire CUDA kernel suite from source.",
    },
}


# Capability clustering signatures so multiple PRs touching the same theme merge into one coherent story
K8S_CLUSTER_THEMES: list[dict[str, Any]] = [
    {
        "id": "dra_gpu_devices",
        "label": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
        "keywords": ["dynamic resource allocation", "dra", "resourceclaim", "deviceshare", "resource.k8s.io", "device plugin", "cdi"],
        "models_workloads": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
        "gpus_infra": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
        "bill_impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting",
    },
    {
        "id": "in_place_pod_resize",
        "label": "In-Place Pod Vertical Scaling (Zero-Restart Resource Resize)",
        "keywords": ["in-place", "inplacepodverticalscaling", "vertical scaling", "pod resize", "resize", "mutablepodresources"],
        "models_workloads": "Stateful microservices, warm inference engines, JVMs, and suspended Batch Jobs needing CPU/RAM adjustments",
        "gpus_infra": "Linux worker nodes and kubelet resource allocation loops",
        "bill_impact": "Eliminates over-provisioning buffer and avoids expensive pod restart cold-starts during traffic spikes",
    },
    {
        "id": "workload_gang_scheduling",
        "label": "Workload-Aware & Gang Scheduling (`PodGroup` / `Job` / Queueing)",
        "keywords": ["gang scheduling", "podgroup", "compositepodgroup", "workload api", "job", "indexed job", "backofflimitperindex", "successpolicy"],
        "models_workloads": "Distributed AI training, multi-node batch jobs, Ray/Spark clusters, and MPI workloads",
        "gpus_infra": "High-density GPU/CPU batch pools and `kube-scheduler` queues",
        "bill_impact": "Prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers",
    },
    {
        "id": "apiserver_etcd_scale",
        "label": "API Server & etcd Watch/Cache Efficiency at Scale",
        "keywords": ["watchlist", "watchcache", "watch cache", "snapshot", "cbor", "consistent read", "unstructuredlist", "etcd", "apiserver"],
        "models_workloads": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
        "gpus_infra": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
        "bill_impact": "Cuts control-plane memory spikes by 30–50% during list storms and prevents cascading `etcd` overload outages",
    },
    {
        "id": "admission_cel_policy",
        "label": "CEL-Based Validating & Mutating Admission Policies",
        "keywords": ["validatingadmissionpolicy", "mutatingadmissionpolicy", "cel", "admission", "staticmanifestsdir", "manifest-based admission"],
        "models_workloads": "Platform security guardrails, multi-tenant compliance policies, and default resource injectors",
        "gpus_infra": "In-process `kube-apiserver` admission chain (replaces external webhook deployments)",
        "bill_impact": "Removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts",
    },
    {
        "id": "workload_security_identity",
        "label": "Workload Identity, User Namespaces & Fine-Grained Authz",
        "keywords": ["user namespace", "usernamespaces", "podcertificate", "impersonation", "constrainedimpersonation", "kubelet api", "apparmor", "supplementalgroups", "boundserviceaccounttoken"],
        "models_workloads": "Multi-tenant SaaS workloads, zero-trust service meshes, and privileged container migrations",
        "gpus_infra": "Linux kernel namespaces, kubelet endpoints, and CSI secret injection paths",
        "bill_impact": "Reduces security agent/sidecar overhead and shrinks blast radius of container compromises",
    },
    {
        "id": "autoscaling_cost",
        "label": "Autoscaling & Scale-to-Zero Cost Optimization",
        "keywords": ["horizontalpodautoscaler", "scale to zero", "scaletozero", "minreplicas", "hpa", "poddisruptionbudget"],
        "models_workloads": "Event-driven workers, async queue consumers, and bursty GPU inference endpoints",
        "gpus_infra": "Autoscaled node pools (Karpenter / Cluster Autoscaler) and HPA controller",
        "bill_impact": "Directly saves compute spend by parking idle worker pools at 0 replicas until queue demand arrives",
    },
    {
        "id": "node_lifecycle_sidecars",
        "label": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
        "keywords": ["sidecar", "sidecarcontainers", "checkpoint", "swap", "graceful node shutdown", "image volume", "imagevolume", "kuberc"],
        "models_workloads": "Service-mesh pods, telemetry agents, fast-restoring stateful apps, and OCI artifact mounts",
        "gpus_infra": "Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes",
        "bill_impact": "Stops zombie sidecars from holding batch nodes open after job completion",
    },
    {
        "id": "networking_nftables_gateway",
        "label": "Networking, `nftables` Proxy & Traffic Observability",
        "keywords": ["nftables", "kube-proxy", "servicecidr", "trafficdistribution", "loadbalancer", "externalips", "dual-stack"],
        "models_workloads": "High-throughput east-west microservices and latency-sensitive ingress traffic",
        "gpus_infra": "Linux dataplane (`nftables`/`ipvs`) and cloud load balancers",
        "bill_impact": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules",
    },
    {
        "id": "storage_pvc_csi",
        "label": "StatefulSet PVC Auto-Cleanup, Volume Health & Storage Expansion",
        "keywords": ["statefulset", "pvc", "persistentvolume", "volumeattributesclass", "volume health", "volumeexpansion", "storageversionmigration"],
        "models_workloads": "Databases, Kafka/ClickHouse clusters, and stateful AI checkpoint storage",
        "gpus_infra": "CSI storage drivers and cloud block volumes",
        "bill_impact": "Eliminates orphaned cloud disk charges when scaling down or deleting temporary StatefulSets",
    },
]

VLLM_CLUSTER_THEMES: list[dict[str, Any]] = [
    {
        "id": "kv_cache_memory_engine",
        "label": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
        "keywords": ["extensible kv cache", "gpu_memory_utilization", "kv cache", "kv offload", "block-size", "block_size", "prefix cache", "hybrid cache", "cpu offload"],
        "models_workloads": "High-concurrency chat APIs, long-context coding agents (32K–128K+), and multi-turn RAG workloads",
        "gpus_infra": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
        "bill_impact": "Expands effective KV capacity by 25–55% per GPU, serving more concurrent users per rack without adding hardware",
    },
    {
        "id": "model_runner_v2_cudagraph",
        "label": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
        "keywords": ["model runner v2", "mrv2", "model runner v1", "vllm_use_v2_model_runner", "cuda graph", "cudagraph", "breakable", "piecewise", "torch.compile"],
        "models_workloads": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
        "gpus_infra": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
        "bill_impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3–15% while simplifying engine maintenance",
    },
    {
        "id": "frontier_moe_deepseek_kimi_glm",
        "label": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
        "keywords": ["deepseek", "glm-5", "kimi", "minimax", "muse spark", "step5", "mla", "sparse-mla", "megamoe", "deepgemm", "flashmla"],
        "models_workloads": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
        "gpus_infra": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
        "bill_impact": "Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
    },
    {
        "id": "speculative_decoding_stack",
        "label": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
        "keywords": ["speculative", "eagle", "dspark", "dflash", "mtp", "suffix decoding", "draft", "speculator", "adaptive verification"],
        "models_workloads": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
        "gpus_infra": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
        "bill_impact": "Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth",
    },
    {
        "id": "quantization_nvfp4_fp8",
        "label": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
        "keywords": ["nvfp4", "mxfp4", "mxfp8", "fp8", "humming", "marlin", "quantization", "w4a8", "w4a16", "compressed-tensors", "qutlass"],
        "models_workloads": "100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
        "gpus_infra": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
        "bill_impact": "Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput",
    },
    {
        "id": "rocm_amd_tpu_xpu",
        "label": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
        "keywords": ["rocm", "mi355x", "mi350", "mi300", "aiter", "flydsl", "mori", "tpu", "xpu", "rdna"],
        "models_workloads": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
        "gpus_infra": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
        "bill_impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
    },
    {
        "id": "new_day0_models_multimodal",
        "label": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
        "keywords": ["new model", "mistral large 4", "inkling", "qwen", "nemotron", "gemma", "whisper", "asr", "transcribe", "multimodal", "encoder", "transformers backend", "lora"],
        "models_workloads": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
        "gpus_infra": "Standard single-node and multi-node GPU inference pools",
        "bill_impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
    },
    {
        "id": "distributed_disagg_resilience",
        "label": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
        "keywords": ["disaggregat", "nixl", "dcp", "pcp", "fault-tolerant", "scale-down", "checkpoint", "criu", "rust frontend", "responses api", "efa"],
        "models_workloads": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
        "gpus_infra": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
        "bill_impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
    },
]


def detect_jargon_in_text(text: str, domain: str, max_items: int = 12) -> list[dict[str, str]]:
    """
    Finds domain jargon terms present in `text` and returns their plain-English
    glossary entries.
    """
    found: list[dict[str, str]] = []
    text_lower = text.lower()
    patterns = {
        "DRA": r"\bdra\b|dynamic resource allocation|resourceclaim",
        "In-Place Pod Resize": r"in-place|vertical scaling|pod resize|mutablepodresources",
        "Gang Scheduling": r"gang scheduling|podgroup|workload api",
        "Sidecar Containers": r"\bsidecar",
        "ValidatingAdmissionPolicy": r"validatingadmissionpolicy|mutatingadmissionpolicy|\bcel\b",
        "User Namespaces": r"user namespace|usernamespaces|hostusers",
        "WatchList": r"watchlist|watchcache|watch cache|snapshottable",
        "nftables": r"nftables|kube-proxy",
        "PodCertificateRequest": r"podcertificate",
        "HPA Scale-to-Zero": r"scale to zero|scaletozero|horizontalpodautoscaler|\bhpa\b",
        "CBOR": r"\bcbor\b",
        "CSI": r"\bcsi\b|persistentvolume|\bpvc\b",
        "Extensible KV Cache": r"extensible kv cache|gpu_memory_utilization|kv cache",
        "Model Runner V2": r"model runner v2|\bmrv2\b|model runner v1",
        "Speculative Decoding": r"speculative|eagle3?|dspark|dflash|\bmtp\b|suffix decoding",
        "MLA": r"\bmla\b|sparse-mla|multi-head latent",
        "NVFP4": r"nvfp4|mxfp4|mxfp8|\bfp8\b|humming|marlin",
        "P/D Disaggregation": r"disaggregat|\bnixl\b|prefill.*decode",
        "DCP": r"\bdcp\b|\bpcp\b|context parallel",
        "MegaMoE": r"megamoe|\bmoe\b|deepgemm|expert parallel",
        "CUDA Graphs": r"cuda graph|cudagraph|torch\.compile",
        "TTFT & TPOT": r"\bttft\b|\btpot\b|\bitl\b|interactivity|throughput",
        "KV Offloading": r"kv offload|prefix cach|cpu offload",
        "LibTorch Stable ABI": r"stable abi|libtorch",
    }
    for key, pat in patterns.items():
        entry = JARGON_GLOSSARY[key]
        if entry["domain"] == domain and re.search(pat, text_lower):
            found.append(entry)
    # Ensure at least 4 high-value glossary items for the domain
    if len(found) < 4:
        for key, entry in JARGON_GLOSSARY.items():
            if entry["domain"] == domain and entry not in found:
                found.append(entry)
                if len(found) >= 5:
                    break
    return found[:max_items]
