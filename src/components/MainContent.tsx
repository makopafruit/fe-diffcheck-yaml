import * as React from "react";
import { diffJson, type Change } from "diff";
import Dropdown from "../components/ui/Dropdown";
import SearchableDropdown from "./ui/SearchableDropdown";
import { useApic } from "../hooks/useApic";
import { useApiDetail } from "../hooks/useApiDetails";

/* ---------- Shared types & data ---------- */
type ApicVersion = "" | "v5" | "v10";
type Environment = "" | "uat" | "staging" | "prod";
type Catalog = "" | "ubp" | "core";

const apicVersionOptions = [
  { value: "v5", label: "v5" },
  { value: "v10", label: "v10" },
] as const;

const ENVIRONMENTS_BY_VERSION: Readonly<
  Record<Exclude<ApicVersion, "">, ReadonlyArray<Exclude<Environment, "">>>
> = {
  v5: ["uat", "staging", "prod"],
  v10: ["uat", "staging", "prod"],
} as const;

const CATALOGS_BY_VERSION_ENV: Readonly<
  Record<
    Exclude<ApicVersion, "">,
    Record<Exclude<Environment, "">, ReadonlyArray<Exclude<Catalog, "">>>
  >
> = {
  v5: {
    uat: ["ubp", "core"],
    staging: ["ubp", "core"],
    prod: ["ubp", "core"],
  } as Record<Exclude<Environment, "">, ReadonlyArray<Exclude<Catalog, "">>>,
  v10: {
    uat: ["ubp", "core"],
    staging: ["ubp", "core"],
    prod: ["ubp", "core"],
  },
} as const;

/* ---------- API item type ---------- */
type ApiItem = {
  id: string;
  info: {
    "x-ibm-name": string;
    title: string;
    version: string;
  };
};

/* ---------- Cascading filter props ---------- */
type CascadingFiltersProps = {
  idPrefix: string;

  // Controlled inputs (provided by parent)
  apicVersion: ApicVersion;
  environment: Environment;
  catalog: Catalog;
  /** Selected API id (not the title). */
  apiName: string;
  yaml: string;

  // Data state (provided by parent)
  apis: ReadonlyArray<ApiItem> | undefined;
  isLoading: boolean;
  error: unknown;

  // Updaters (parent handles cascade resets)
  onChangeVersion: (v: ApicVersion) => void;
  onChangeEnvironment: (e: Environment) => void;
  onChangeCatalog: (c: Catalog) => void;
  onChangeApiName: (name: string) => void;
  onChangeYaml: (yaml: string) => void;
};

/* ---------- Minimal JSON viewer ---------- */
type JsonPaneProps = {
  title: string;
  data?: unknown;
  loading?: boolean;
  error?: unknown;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  /** When present, render read-only JSON with removed chunks highlighted (left-side view of a diff) */
  highlightRemoved?: Change[];
  highlightAdded?: Change[];
};
function JsonPane({
  title,
  data,
  loading,
  error,
  textareaRef,
  highlightRemoved,
  highlightAdded, // NEW
}: JsonPaneProps) {

  // RIGHT-SIDE DIFF VIEW: show only additions in green, hide removals
  if (highlightAdded && highlightAdded.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {title}
          </h3>
        </div>
        <div className="p-3 font-mono">
          <pre className="whitespace-pre-wrap break-words text-xs md:text-sm">
            {highlightAdded.map((part, i) => {
              if (part.removed) return null; // right view: skip deletions
              const cls = part.added ? "bg-green-50 text-green-800" : "";
              return (
                <span key={i} className={cls}>
                  {part.value}
                </span>
              );
            })}
          </pre>
        </div>
      </div>
    );
  }

  // LEFT-SIDE DIFF VIEW: show only removals in red, hide additions (existing)
  if (highlightRemoved && highlightRemoved.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {title}
          </h3>
        </div>
        <div className="p-3 font-mono">
          <pre className="whitespace-pre-wrap break-words text-xs md:text-sm">
            {highlightRemoved.map((part, i) => {
              if (part.added) return null; // left view: skip additions
              const cls = part.removed ? "bg-red-50 text-red-800" : "";
              return (
                <span key={i} className={cls}>
                  {part.value}
                </span>
              );
            })}
          </pre>
        </div>
      </div>
    );
  }

  // original editable textarea modes…
  let body: React.ReactNode;
  if (loading) {
    body = <div className="animate-pulse text-gray-500">Loading…</div>;
  } else if (error) {
    body = (
      <div className="text-sm text-red-600">
        {(error as Error)?.message ?? "Failed to load."}
      </div>
    );
  } else if (!data) {
    body = (
      <textarea
        ref={textareaRef}
        className="h-64 w-full resize-y rounded-md border border-gray-200 bg-white p-2 font-mono text-xs leading-5 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="No data"
      />
    );
  } else {
    body = (
      <textarea
        ref={textareaRef}
        className="h-64 w-full resize-y rounded-md border border-gray-200 bg-white p-2 font-mono text-xs leading-5 outline-none focus:ring-2 focus:ring-indigo-500"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        inputMode="text"
        defaultValue={JSON.stringify(data, null, 2)}
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {title}
        </h3>
      </div>
      <div className="p-3 font-mono">{body}</div>
    </div>
  );
}
/* ---------- Stateless filter group ---------- */
function CascadingFilters({
  idPrefix,
  apicVersion,
  environment,
  catalog,
  apiName,
  apis,
  isLoading,
  onChangeVersion,
  onChangeEnvironment,
  onChangeCatalog,
  onChangeApiName,
}: CascadingFiltersProps) {
  const parentsChosen = Boolean(apicVersion && environment && catalog);

  const environmentOptions = React.useMemo(() => {
    if (!apicVersion) return [];
    return ENVIRONMENTS_BY_VERSION[apicVersion].map((v) => ({
      value: v,
      label: v,
    }));
  }, [apicVersion]);

  const catalogOptions = React.useMemo(() => {
    if (!apicVersion || !environment) return [];
    const byEnv =
      CATALOGS_BY_VERSION_ENV[apicVersion][
        environment as Exclude<Environment, "">
      ];
    return (byEnv ?? []).map((c) => ({ value: c, label: c }));
  }, [apicVersion, environment]);

  const apiNameOptions = React.useMemo(() => {
    if (!parentsChosen || !apis?.length) return [];
    return apis.map((api) => ({
      value: api.id, // store id
      label: `${api.info.title} ${api.info.version}`,
    }));
  }, [parentsChosen, apis]);

  const apiNamePlaceholder = !parentsChosen
    ? "Select version/env/catalog first…"
    : isLoading
    ? "Searching…"
    : "Search API name…";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col md:flex-row md:items-end md:gap-3">
        <label
          htmlFor={`${idPrefix}-yaml`}
          className="text-sm font-medium text-gray-700"
        >
        </label>

        {/* APIC Version */}
        <div className="flex flex-col">
          <label
            htmlFor={`${idPrefix}-apic-version`}
            className="mb-1 text-xs font-medium text-gray-700"
          >
            APIC Version
          </label>
          <Dropdown
            id={`${idPrefix}-apic-version`}
            value={apicVersion}
            onChange={onChangeVersion}
            options={apicVersionOptions}
            placeholder="Please select…"
          />
        </div>

        {/* Environment */}
        <div className="flex flex-col">
          <label
            htmlFor={`${idPrefix}-environment`}
            className="mb-1 text-xs font-medium text-gray-700"
          >
            Environment
          </label>
          <Dropdown
            id={`${idPrefix}-environment`}
            value={environment}
            onChange={onChangeEnvironment}
            options={environmentOptions}
            placeholder="Please select…"
            disabled={!apicVersion}
          />
        </div>

        {/* Catalog */}
        <div className="flex flex-col">
          <label
            htmlFor={`${idPrefix}-catalog`}
            className="mb-1 text-xs font-medium text-gray-700"
          >
            Catalog
          </label>
          <Dropdown
            id={`${idPrefix}-catalog`}
            value={catalog}
            onChange={onChangeCatalog}
            options={catalogOptions}
            placeholder="Please select…"
            disabled={!apicVersion || !environment}
          />
        </div>

        {/* API Name */}
        <div className="flex flex-col">
          <label
            htmlFor={`${idPrefix}-api-name`}
            className="mb-1 text-xs font-medium text-gray-700"
          >
            API Name
          </label>
          <SearchableDropdown
            id={`${idPrefix}-api-name`}
            value={apiName || ""}
            onChange={onChangeApiName}
            options={apiNameOptions}
            placeholder={apiNamePlaceholder}
            disabled={!parentsChosen || isLoading}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function MainContent() {
  // Left side state
  const [leftVersion, setLeftVersion] = React.useState<ApicVersion>("");
  const [leftEnv, setLeftEnv] = React.useState<Environment>("");
  const [leftCatalog, setLeftCatalog] = React.useState<Catalog>("");
  const [leftApi, setLeftApi] = React.useState(""); // selected API id
  const [leftYaml, setLeftYaml] = React.useState("");

  // Right side state
  const [rightVersion, setRightVersion] = React.useState<ApicVersion>("");
  const [rightEnv, setRightEnv] = React.useState<Environment>("");
  const [rightCatalog, setRightCatalog] = React.useState<Catalog>("");
  const [rightApi, setRightApi] = React.useState(""); // selected API id
  const [rightYaml, setRightYaml] = React.useState("");

  // Load API lists for each side
  const leftQuery = useApic({
    version: leftVersion,
    environment: leftEnv,
    catalog: leftCatalog,
  });
  const rightQuery = useApic({
    version: rightVersion,
    environment: rightEnv,
    catalog: rightCatalog,
  });

  // Load API details when an id is selected
  const leftDetail = useApiDetail(leftApi, true);
  const rightDetail = useApiDetail(rightApi, true);

  const leftTextRef = React.useRef<HTMLTextAreaElement>(null);
  const rightTextRef = React.useRef<HTMLTextAreaElement>(null);

  // simple place to put the diff result later (optional for now)
  const [diffResult, setDiffResult] = React.useState<Change[]>([]);
  const [compareError, setCompareError] = React.useState<string | null>(null);

  const handleCompare = () => {
  setCompareError(null);
  try {
    const leftText = leftTextRef.current?.value ?? "";
    const rightText = rightTextRef.current?.value ?? "";

    // parse; treat empty as {}
    const leftObj = leftText ? JSON.parse(leftText) : {};
    const rightObj = rightText ? JSON.parse(rightText) : {};

    const changes = diffJson(leftObj, rightObj);
    setDiffResult(changes);      // keep for later UI
    console.log("JSON DIFF:", changes);
  } catch (err) {
    setDiffResult([]);
    setCompareError((err as Error).message || "Invalid JSON input.");
    console.error(err);
    }
  };

  // Cascading resets (left)
  const onLeftVersion = (v: ApicVersion) => {
    setLeftVersion(v);
    setLeftEnv("");
    setLeftCatalog("");
    setLeftApi("");
  };
  const onLeftEnv = (e: Environment) => {
    setLeftEnv(e);
    setLeftCatalog("");
    setLeftApi("");
  };
  const onLeftCatalog = (c: Catalog) => {
    setLeftCatalog(c);
    setLeftApi("");
  };

  // Cascading resets (right)
  const onRightVersion = (v: ApicVersion) => {
    setRightVersion(v);
    setRightEnv("");
    setRightCatalog("");
    setRightApi("");
  };
  const onRightEnv = (e: Environment) => {
    setRightEnv(e);
    setRightCatalog("");
    setRightApi("");
  };
  const onRightCatalog = (c: Catalog) => {
    setRightCatalog(c);
    setRightApi("");
  };

  // Compare is allowed when both sides have data ready
  const canCompare =
    !!leftApi &&
    !!rightApi &&
    !leftDetail.isLoading &&
    !rightDetail.isLoading &&
    !leftDetail.error &&
    !rightDetail.error;

  const resetAll = () => {
  // Left
  setLeftVersion("");
  setLeftEnv("");
  setLeftCatalog("");
  setLeftApi("");
  setLeftYaml("");

  // Right
  setRightVersion("");
  setRightEnv("");
  setRightCatalog("");
  setRightApi("");
  setRightYaml("");

  // Diff state
  setDiffResult([]);
  setCompareError(null);

  // Clear the editable textareas (uncontrolled DOM values)
  requestAnimationFrame(() => {
    if (leftTextRef.current)  leftTextRef.current.value = "";
    if (rightTextRef.current) rightTextRef.current.value = "";
    leftTextRef.current?.blur();
    rightTextRef.current?.blur();
  });

  // Optionally scroll back to top of the page
  // window.scrollTo({ top: 0, behavior: "smooth" });
};

React.useEffect(() => {
  const onReset = () => resetAll(); // call your existing resetAll

  // guard for SSR
  if (typeof window !== "undefined") {
    window.addEventListener("app:reset-all", onReset);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("app:reset-all", onReset);
    }
  };
}, [/* if resetAll is stable, deps can be [] */]);


  return (
    <div className="w-full">
      <section id="editors" aria-labelledby="editors-title" className="space-y-3">
        <h2 id="editors-title" className="sr-only">
          Editors
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* LEFT */}
          <CascadingFilters
            idPrefix="left"
            apicVersion={leftVersion}
            environment={leftEnv}
            catalog={leftCatalog}
            apiName={leftApi}
            yaml={leftYaml}
            apis={leftQuery.data as ReadonlyArray<ApiItem> | undefined}
            isLoading={!!leftQuery.isLoading}
            error={leftQuery.error}
            onChangeVersion={onLeftVersion}
            onChangeEnvironment={onLeftEnv}
            onChangeCatalog={onLeftCatalog}
            onChangeApiName={setLeftApi}
            onChangeYaml={setLeftYaml}
          />

          {/* RIGHT */}
          <CascadingFilters
            idPrefix="right"
            apicVersion={rightVersion}
            environment={rightEnv}
            catalog={rightCatalog}
            apiName={rightApi}
            yaml={rightYaml}
            apis={rightQuery.data as ReadonlyArray<ApiItem> | undefined}
            isLoading={!!rightQuery.isLoading}
            error={rightQuery.error}
            onChangeVersion={onRightVersion}
            onChangeEnvironment={onRightEnv}
            onChangeCatalog={onRightCatalog}
            onChangeApiName={setRightApi}
            onChangeYaml={setRightYaml}
          />
        </div>
      </section>

      {/* JSON detail panes */}
      <section className="mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <JsonPane
            title="Left API Detail (Swagger JSON)"
            data={leftDetail.data}
            loading={leftDetail.isLoading}
            error={leftDetail.error}
            textareaRef={leftTextRef}
            highlightRemoved={diffResult}
          />
          <JsonPane
            title="Right API Detail (Swagger JSON)"
            data={rightDetail.data}
            loading={rightDetail.isLoading}
            error={rightDetail.error}
            textareaRef={rightTextRef}
            highlightAdded={diffResult}
          />
        </div>
      </section>

      {/* Actions */}
      <section
        id="actions"
        aria-labelledby="actions-heading"
        className="mt-6 flex items-center justify-center"
      >
        <h2 id="actions-heading" className="sr-only">
          Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canCompare}
            onClick={handleCompare}
          >
            {canCompare ? "Compare" : "Loading…"}
          </button>
        </div>
      </section>
    </div>
  );
}
