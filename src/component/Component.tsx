import React, { useState, useEffect } from "react";
import "./component.css";

// Resource type
type Resource = {
  type: string;
  name?: string;
  env: string;
  queueType?: "Standard" | "FIFO";
  purpose?: string;
  deploymentType?: "primary" | "canary";
};

// Windmill custom component props type
type WindmillCustomComponentProps = {
  passSetters?: (setter: any) => void;
  setOutput?: (output: any) => void;
  renderInit?: boolean;
};

function generateDefaultResourceName(
  resourceType: string,
  serviceName: string,
  env: string,
  index: number
) {
  // For first of its type: "prod-blinkit-service-db", then add numeric suffix for duplicates
  const typeSlug = resourceType.replace(/\s+/g, '-').toLowerCase();
  const serviceSlug = (serviceName || "service").replace(/\s+/g, '-').toLowerCase();

  let base: string;
  if (resourceType === "RDS Cluster") {
    base = `${env}-blinkit-${serviceSlug}-db`;
  } else if (resourceType === "Elasticache Cluster") {
    base = `${env}-blinkit-${serviceSlug}-cache`;
  } else if (resourceType === "DynamoDB Table") {
    base = `${env}-blinkit-${serviceSlug}-table`;
  } else {
    base = `${env}-${serviceSlug}-${typeSlug}`;
  }

  return index === 1 ? base : `${base}-${index}`;
}

const RESOURCE_TYPES = [
  "RDS Cluster",
  "DynamoDB Table",
  "Elasticache Cluster",
  "SQS Queue",
  "S3 Bucket"
];

const ENV_KEYS = ["prod", "preprod"] as const;
const ENV_LABELS = ["Production", "Pre-Production"] as const;

function customComponent(props: WindmillCustomComponentProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [resources, setResources] = useState<Resource[][]>([[], []]);
  const [resourceType, setResourceType] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [sqsType, setSqsType] = useState<"Standard" | "FIFO" | "">("");
  const [sqsPurpose, setSqsPurpose] = useState<string>("");
  const [deploymentType, setDeploymentType] = useState<"primary" | "canary" | "">("");
  const [render, setRender] = useState(props.renderInit ?? true);
  const [input, setInput] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // environments from input enable/disable the two fixed tabs (prod/preprod)
  // Accept environments as either an array of strings or a boolean map { prod: true, preprod: false }
  let enabledSet: Set<string>;
  if (Array.isArray(input?.environments)) {
    const providedEnvs: string[] = (input.environments as any[]).map((e) => String(e).toLowerCase());
    enabledSet = new Set(providedEnvs.length === 0 ? ENV_KEYS : providedEnvs);
  } else if (input?.environments && typeof input.environments === "object") {
    const flags = input.environments as Record<string, any>;
    const enabledList = (ENV_KEYS as readonly string[]).filter((k) => Boolean(flags[k]));
    enabledSet = new Set(enabledList.length === 0 ? ENV_KEYS : enabledList);
  } else {
    enabledSet = new Set(ENV_KEYS);
  }

  useEffect(() => {
    if (props.passSetters) {
      props.passSetters({
        onInput: (input: any) => {
          setInput(input);
        },
        onRender: setRender,
      });
    }
  }, [props.passSetters]);

  // Ensure there are exactly two env buckets and active tab is enabled
  useEffect(() => {
    setResources((prev) => {
      if (prev.length === 2) return prev;
      const next: Resource[][] = [];
      for (let i = 0; i < 2; i++) {
        next[i] = prev[i] ? prev[i] : [];
      }
      return next;
    });
    if (!enabledSet.has(ENV_KEYS[activeTab])) {
      const fallbackIndex = enabledSet.has("prod") ? 0 : (enabledSet.has("preprod") ? 1 : 0);
      setActiveTab(fallbackIndex);
    }
  }, [enabledSet, activeTab]);

  // Auto-update output whenever resources change
  useEffect(() => {
    if (props.setOutput) {
      props.setOutput({
        production: resources[0],
        preProduction: resources[1],
      });
    }
  }, [resources, props.setOutput]);

  const handleAddResource = () => {
    if (!resourceType) return;
    const serviceName = input.serviceName;
    if (!serviceName) return;

    setError(null);

    const trimmedName = resourceName.trim();

    if (resourceType === "SQS Queue") {
      if (!sqsType) {
        setError("SQS Queue type is required (Standard or FIFO).");
        return;
      }
      if (!sqsPurpose.trim()) {
        setError("SQS Queue purpose is required.");
        return;
      }
      // Check for deployment type only when in production tab
      if (activeTab === 0 && !deploymentType) {
        setError("Deployment type is required for production SQS queues (Primary or Canary).");
        return;
      }
    }

    // S3 bucket must have a name explicitly provided
    if (resourceType === "S3 Bucket" && !trimmedName) {
      setError("S3 bucket name is required.");
      return;
    }

    const env: string = ENV_KEYS[activeTab] || "";
    if (!enabledSet.has(env)) {
      setError(`Environment "${env}" is disabled.`);
      return;
    }

    const sameTypeCount = resources[activeTab].filter(r => r.type === resourceType).length;
    const defaultName = generateDefaultResourceName(
      resourceType,
      serviceName,
      env,
      sameTypeCount + 1
    );

    const newResource: Resource = {
      type: resourceType,
      env,
      name:
        resourceType === "SQS Queue"
          ? undefined
          : resourceType === "S3 Bucket"
            ? trimmedName
            : (trimmedName || defaultName),
      queueType: resourceType === "SQS Queue" ? (sqsType || undefined) : undefined,
      purpose: resourceType === "SQS Queue" ? (sqsPurpose.trim() || undefined) : undefined,
      deploymentType: resourceType === "SQS Queue" && env.toLowerCase() === "prod" ? (deploymentType || undefined) : undefined,
    };
    const updated = [...resources];
    updated[activeTab] = [...updated[activeTab], newResource];
    setResources(updated);
    setResourceType("");
    setResourceName("");
    setSqsType("");
    setSqsPurpose("");
    setDeploymentType("");
  };

  const handleDeleteResource = (idx: number) => {
    const updated = [...resources];
    updated[activeTab] = updated[activeTab].filter((_, i) => i !== idx);
    setResources(updated);
  };


  if (!render) return null;
  if (!input.serviceName) {
    return (
      <div style={{ color: 'var(--wm-danger)', fontWeight: 600 }}>
        Error: <code>serviceName</code> input is required from Windmill.
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--wm-bg)',
      color: 'var(--wm-text)',
      borderRadius: 16,
      padding: 32,
      maxWidth: 700,
      margin: '40px auto',
      border: '1px solid var(--wm-border)',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>AWS Resources Configuration</h2>
        </div>
      </div>
      <div style={{ display: "flex", marginBottom: 16 }}>
        {ENV_LABELS.map((tab, i) => {
          const envKey = ENV_KEYS[i];
          const isEnabled = enabledSet.has(envKey);
          return (
            <button
              key={tab}
              onClick={() => {
                if (!isEnabled) return;
                setActiveTab(i);
                setDeploymentType(""); // Reset deployment type when switching tabs
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                background: activeTab === i ? 'var(--wm-surface)' : 'var(--wm-tab-inactive-bg)',
                border: '1px solid var(--wm-border)',
                borderBottom: activeTab === i ? 'none' : '1px solid var(--wm-border)',
                fontWeight: 600,
                color: isEnabled ? 'var(--wm-text)' : 'var(--wm-muted)',
                borderRadius: i === 0 ? "8px 0 0 0" : "0 8px 0 0",
                cursor: isEnabled ? "pointer" : "not-allowed",
                opacity: isEnabled ? 1 : 0.6,
                fontFamily: '"Times New Roman", Times, serif'
              }}
              disabled={!isEnabled}
            >
              {tab} ({(resources[i] || []).length} resources)
            </button>
          );
        })}
      </div>
      <div style={{
        background: 'var(--wm-surface)',
        border: '1px solid var(--wm-border)',
        borderRadius: '0 0 8px 8px',
        padding: 24,
        minHeight: 180,
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Configured Resources</div>
        {(resources[activeTab] || []).length === 0 ? (
          <div style={{ color: 'var(--wm-muted)', marginBottom: 24 }}>
            No resources configured for {ENV_LABELS[activeTab].toLowerCase()} yet.
          </div>
        ) : (
          <ul style={{ padding: 0, margin: 0, listStyle: "none", marginBottom: 24 }}>
            {(resources[activeTab] || []).map((res, idx) => (
              <li key={idx} style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                background: 'var(--wm-item-bg)',
                borderRadius: 6,
                padding: "6px 12px",
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                <span style={{ flex: 1 }}>
                  {res.type}
                  {res.type !== "SQS Queue" && res.name ? <>: <b>{res.name}</b></> : null}
                  {res.type === "SQS Queue" && (
                    <span> 
                      — type: <i>{res.queueType}</i>, purpose: <i>{res.purpose}</i>
                      {res.deploymentType && <span>, deployment: <i>{res.deploymentType}</i></span>}
                    </span>
                  )}
                  <span style={{ color: 'var(--wm-muted)' }}> ({res.env})</span>
                </span>
                <button onClick={() => handleDeleteResource(idx)} style={{
                  background: "none",
                  border: "none",
                  color: 'var(--wm-danger)',
                  fontSize: 18,
                  cursor: "pointer",
                  fontFamily: '"Times New Roman", Times, serif'
                }} title="Delete resource">🗑️</button>
              </li>
            ))}
          </ul>
        )}
        <hr style={{ margin: "24px 0 16px 0", border: 0, borderTop: '1px solid var(--wm-border)' }} />
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Add New Resource</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={resourceType} onChange={e => { 
            setResourceType(e.target.value); 
            setError(null); 
            setDeploymentType(""); // Reset deployment type when resource type changes
          }} style={{
            padding: 8,
            borderRadius: 4,
            border: '1px solid var(--wm-border)',
            minWidth: 180,
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            <option value="">Select resource type</option>
            {RESOURCE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {resourceType === "SQS Queue" && (
            <>
              <select value={sqsType} onChange={e => setSqsType(e.target.value as any)} style={{
                padding: 8,
                borderRadius: 4,
                border: '1px solid var(--wm-border)',
                minWidth: 140,
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                <option value="">Queue type</option>
                <option value="Standard">Standard</option>
                <option value="FIFO">FIFO</option>
              </select>
              <input
                type="text"
                placeholder="purpose (required for SQS)"
                value={sqsPurpose}
                onChange={e => setSqsPurpose(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid var(--wm-border)',
                  minWidth: 180,
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              />
              {ENV_KEYS[activeTab]?.toLowerCase() === "prod" && (
                <select value={deploymentType} onChange={e => setDeploymentType(e.target.value as any)} style={{
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid var(--wm-border)',
                  minWidth: 140,
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  <option value="">Deployment type</option>
                  <option value="primary">Primary</option>
                  <option value="canary">Canary</option>
                </select>
              )}
            </>
          )}
          {resourceType !== "SQS Queue" && (
            <input
              type="text"
              placeholder={resourceType === "S3 Bucket" ? "bucket-name (required)" : "resource-name (leave empty for default)"}
              value={resourceName}
              onChange={e => setResourceName(e.target.value)}
              style={{
                padding: 8,
                borderRadius: 4,
                border: '1px solid var(--wm-border)',
                minWidth: 200,
                fontFamily: '"Times New Roman", Times, serif'
              }}
            />
          )}
          <button
            onClick={handleAddResource}
            style={{
              background: 'var(--wm-accent)',
              color: '#0b1220',
              border: "none",
              borderRadius: 4,
              padding: "8px 18px",
              fontWeight: 600,
              cursor:
                resourceType && (
                  resourceType === "SQS Queue"
                    ? (sqsType && sqsPurpose.trim() && (activeTab !== 0 || deploymentType))
                    : (resourceType === "S3 Bucket" ? !!resourceName.trim() : true)
                )
                  ? "pointer"
                  : "not-allowed",
              opacity:
                resourceType && (
                  resourceType === "SQS Queue"
                    ? (sqsType && sqsPurpose.trim() && (activeTab !== 0 || deploymentType))
                    : (resourceType === "S3 Bucket" ? !!resourceName.trim() : true)
                )
                  ? 1
                  : 0.6,
              fontFamily: '"Times New Roman", Times, serif'
            }}
            disabled={
              !resourceType ||
              (resourceType === "SQS Queue" && (!sqsType || !sqsPurpose.trim())) ||
              (resourceType === "SQS Queue" && activeTab === 0 && !deploymentType) ||
              (resourceType === "S3 Bucket" && !resourceName.trim())
            }
          >
            + Add Resource
          </button>
        </div>
        {error && (
          <div style={{ color: 'var(--wm-danger)', marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {/* Submit button removed; output updates automatically */}
      </div>
    </div>
  );
}

export default customComponent;