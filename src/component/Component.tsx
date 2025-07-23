import React, { useState, useEffect } from "react";
import "./component.css";

// Resource type
type Resource = {
  type: string;
  name: string;
};

// Windmill custom component props type
type WindmillCustomComponentProps = {
  passSetters?: (setter: any) => void;
  setOutput?: (output: any) => void;
  renderInit?: boolean;
};

function generateDefaultResourceName(resourceType: string, serviceName: string, index: number) {
  // Example: "myservice-rds-cluster-1"
  const typeSlug = resourceType.replace(/\s+/g, '-').toLowerCase();
  const serviceSlug = (serviceName || "service").replace(/\s+/g, '-').toLowerCase();
  return `${serviceSlug}-${typeSlug}-${index}`;
}

const RESOURCE_TYPES = [
  "RDS Cluster",
  "DynamoDB Table",
  "Elasticache Cluster",
  "SQS Queue"
];

const tabNames = ["Production", "Pre-Production"];

function customComponent(props: WindmillCustomComponentProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [resources, setResources] = useState<Resource[][]>([[], []]);
  const [resourceType, setResourceType] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [render, setRender] = useState(props.renderInit ?? true);
  const [input, setInput] = useState<any>({});

  // Windmill passSetters integration (optional)
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

  const handleAddResource = () => {
    if (!resourceType) return;
    const serviceName = input.serviceName;
    if (!serviceName) return; // Don't add if missing
    const newResource: Resource = {
      type: resourceType,
      name: resourceName || generateDefaultResourceName(resourceType, serviceName, resources[activeTab].length + 1),
    };
    const updated = [...resources];
    updated[activeTab] = [...updated[activeTab], newResource];
    setResources(updated);
    setResourceType("");
    setResourceName("");
  };

  const handleDeleteResource = (idx: number) => {
    const updated = [...resources];
    updated[activeTab] = updated[activeTab].filter((_, i) => i !== idx);
    setResources(updated);
  };

  const handleSubmit = () => {
    if (props.setOutput) {
      props.setOutput({
        production: resources[0],
        preProduction: resources[1],
      });
    }
  };

  if (!render) return null;
  if (!input.serviceName) {
    return (
      <div style={{ color: 'red', fontWeight: 600 }}>
        Error: <code>serviceName</code> input is required from Windmill.
      </div>
    );
  }

  return (
    <div style={{
      background: "#f8fafc",
      borderRadius: 16,
      padding: 32,
      maxWidth: 700,
      margin: "40px auto",
      boxShadow: "0 2px 12px #0001",
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        {/* Removed the left arrow button */}
        <div>
          <h2 style={{ margin: 0 }}>AWS Resources Configuration</h2>
        </div>
      </div>
      <div style={{ display: "flex", marginBottom: 16 }}>
        {tabNames.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: activeTab === i ? "#fff" : "#f1f5f9",
              border: "1px solid #e5e7eb",
              borderBottom: activeTab === i ? "none" : "1px solid #e5e7eb",
              fontWeight: 600,
              color: "#222",
              borderRadius: i === 0 ? "8px 0 0 0" : "0 8px 0 0",
              cursor: "pointer",
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            {tab} ({resources[i].length} resources)
          </button>
        ))}
      </div>
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "0 0 8px 8px",
        padding: 24,
        minHeight: 180,
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Configured Resources</div>
        {resources[activeTab].length === 0 ? (
          <div style={{ color: "#888", marginBottom: 24 }}>
            No resources configured for {tabNames[activeTab].toLowerCase()} yet.
          </div>
        ) : (
          <ul style={{ padding: 0, margin: 0, listStyle: "none", marginBottom: 24 }}>
            {resources[activeTab].map((res, idx) => (
              <li key={idx} style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                background: "#f1f5f9",
                borderRadius: 6,
                padding: "6px 12px",
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                <span style={{ flex: 1 }}>{res.type}: <b>{res.name}</b></span>
                <button onClick={() => handleDeleteResource(idx)} style={{
                  background: "none",
                  border: "none",
                  color: "#d11a2a",
                  fontSize: 18,
                  cursor: "pointer",
                  fontFamily: '"Times New Roman", Times, serif'
                }} title="Delete resource">🗑️</button>
              </li>
            ))}
          </ul>
        )}
        <hr style={{ margin: "24px 0 16px 0", border: 0, borderTop: "1px solid #eee" }} />
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Add New Resource</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <select value={resourceType} onChange={e => setResourceType(e.target.value)} style={{
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            minWidth: 140,
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            <option value="">Select resource type</option>
            {RESOURCE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="resource-name(default name will be generated if left empty)"
            value={resourceName}
            onChange={e => setResourceName(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              minWidth: 160,
              fontFamily: '"Times New Roman", Times, serif'
            }}
          />
          <button
            onClick={handleAddResource}
            style={{
              background: "#4ade80",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "8px 18px",
              fontWeight: 600,
              cursor: resourceType ? "pointer" : "not-allowed",
              opacity: resourceType ? 1 : 0.6,
              fontFamily: '"Times New Roman", Times, serif'
            }}
            disabled={!resourceType}
          >
            + Add Resource
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 32px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            fontFamily: '"Times New Roman", Times, serif'
          }} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default customComponent;