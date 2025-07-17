import React, { useState, useEffect } from "react";

// -- Customizable resource types --
const resourceTypes = [
  "S3 Bucket",
  "DynamoDB Table",
  "Lambda Function",
  "RDS Instance",
];

type Resource = {
  type: string;
  name: string;
};

type ComponentProps = {
  outputs: any;
  passSetters: (setter: any) => void;
  setOutput: (output: any) => void;
  renderInit: boolean;
  input: {
    environment: string;
    // Add other input fields here as needed
  };
};

const initialForm = {
  type: "",
  name: "",
};

const ResourceConfigSection = ({
  resources,
  environment,
  onAdd,
  onRemove,
  newResource,
  updateNewResource,
}) => (
  <div className="wm-card">
    <h3 className="wm-section-title">Configured Resources</h3>
    {resources.length === 0 ? (
      <div className="wm-empty-state">
        No resources configured for {environment} yet.
      </div>
    ) : (
      <table className="wm-resource-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {resources.map((r, idx) => (
            <tr key={idx}>
              <td>{r.type}</td>
              <td>{r.name}</td>
              <td>
                <button
                  className="wm-btn danger"
                  onClick={() => onRemove(idx)}
                  aria-label="Remove"
                >
                  &#10005;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    <div className="wm-divider" />

    <h4 className="wm-subsection-title">Add New Resource</h4>
    <form
      className="wm-resource-form"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd();
      }}
    >
      <div className="wm-form-group">
        <label className="wm-label" htmlFor="resource-type">
          Resource Type
        </label>
        <select
          className="wm-input"
          id="resource-type"
          name="type"
          value={newResource.type}
          onChange={(e) => updateNewResource({ ...newResource, type: e.target.value })}
          required
        >
          <option value="">Select resource type</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="wm-form-group">
        <label className="wm-label" htmlFor="resource-name">
          Resource Name{" "}
          <span className="wm-optional">
            (optional - will use default naming)
          </span>
        </label>
        <input
          className="wm-input"
          id="resource-name"
          name="name"
          type="text"
          placeholder="resource-name"
          value={newResource.name}
          onChange={e => updateNewResource({ ...newResource, name: e.target.value })}
        />
      </div>

      <button
        className="wm-btn add"
        type="submit"
        disabled={!newResource.type}
      >
        <span className="wm-btn-icon">+</span> Add Resource
      </button>
    </form>
  </div>
);

const Component: React.FC<ComponentProps> = ({
  outputs, setOutput, passSetters: _passSetters, renderInit: _renderInit, input
}) =>   {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState(initialForm);

  useEffect(() => {
    setOutput({ result: resources });
    if (outputs?.set) outputs.set("result", resources);
    else if (outputs) outputs.result = resources;
  }, [resources, setOutput, outputs]);

  const handleAdd = () => {
    if (newResource.type) {
      setResources(prev => [...prev, newResource]);
      setNewResource(initialForm);
      // outputs.set(...) is handled by useEffect above
    }
  };

  const handleRemove = (idx) => {
    setResources(prev => prev.filter((_, i) => i !== idx));
    // outputs.set(...) is handled by useEffect above
  };

  return (
    <div className="wm-main-bg">
      <style>{`
        .wm-main-bg {
          min-height: 100vh;
          background: #f7fafd;
          font-family: "Times New Roman", Times, serif;
        }
        .wm-card {
          max-width: 700px;
          background: #fff;
          margin: 0 auto;
          border-radius: 14px;
          box-shadow: 0 1.5px 20px rgba(0,0,0,0.04), 0 0.5px 1.5px rgba(0,0,0,0.03);
          padding: 36px 36px 28px 36px;
        }
        .wm-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #181d23;
          margin-bottom: 10px;
        }
        .wm-subsection-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #202632;
          margin-bottom: 10px;
          margin-top: 16px;
        }
        .wm-divider {
          width: 100%;
          height: 1.5px;
          background: #eff1f6;
          margin: 30px 0 12px;
          border-radius: 2px;
        }
        .wm-form-group {
          display: flex;
          flex-direction: column;
          flex: 1 1 0;
          min-width: 180px;
        }
        .wm-resource-form {
          display: flex;
          gap: 18px;
          margin-bottom: 0;
          margin-top: 18px;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .wm-label {
          font-size: 0.98rem;
          color: #23282e;
          margin-bottom: 7px;
          font-weight: 500;
        }
        .wm-optional {
          font-size: 0.92rem;
          color: #8191a4;
          font-weight: 400;
        }
        .wm-input, .wm-input:focus {
          font-size: 1rem;
          border-radius: 8px;
          border: 1px solid #dee2ee;
          background: #f7fafc;
          color: #20242e;
          padding: 9px 13px;
          outline: none;
          box-shadow: none;
          margin-bottom: 0;
        }
        .wm-input:focus {
          border-color: #8191a4;
          background: #f3fff7;
        }
        .wm-resource-table {
          width: 100%;
          background: transparent;
          border-collapse: collapse;
          margin-bottom: 0;
        }
        .wm-resource-table th, .wm-resource-table td {
          text-align: left;
          padding: 10px 14px;
          font-size: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }
        .wm-resource-table th {
          background: #fafbfc;
          color: #222;
          font-weight: 600;
        }
        .wm-btn {
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          padding: 11px 18px;
          border: none;
          cursor: pointer;
          margin: 0;
          display: flex;
          align-items: center;
        }
        .wm-btn.add {
          background: linear-gradient(90deg, #8191a4, #8191a4);
          color: #fff;
          width: 100%;
          justify-content: center;
          margin-top: 8px;
          font-weight: 600;
        }
        .wm-btn.danger {
          background: #fee2e2;
          color: #ef4444;
          padding: 0 11px;
          font-size: 1.1rem;
          margin-left: 0;
        }
        .wm-btn.add:disabled {
          background: #d1fae5;
        }
        .wm-btn-icon {
          font-size: 1.45rem;
          display: inline-block;
          margin-right: 12px;
        }
        .wm-empty-state {
          padding: 16px 0 28px 0;
          color: #7a868f;
          font-size: 1rem;
          text-align: left;
        }
        @media (max-width: 700px) {
          .wm-card { padding: 20px 8px 18px 8px; }
        }
        @media (max-width: 430px) {
          .wm-resource-form {
            flex-direction: column;
            gap: 9px;
          }
        }
      `}</style>
      <ResourceConfigSection
    resources={resources}
    environment={input.environment}  // 🔑 Now it's from input.environment!
    onAdd={handleAdd}
    onRemove={handleRemove}
    newResource={newResource}
    updateNewResource={setNewResource}
  />
    </div>
  );
};

export default Component;
