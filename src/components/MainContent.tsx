import * as React from "react";
import Dropdown from "../components/ui/Dropdown";
import SearchableDropdown from "./ui/SearchableDropdown";
import { useApic } from "../hooks/useApic";
import { useApiDetail } from "../hooks/useApiDetails";

/* ---------- Shared types & data (defined once) ---------- */
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

/* ---------- Types for controlled data ---------- */
type ApiItem =  {
  id: string;
  info: {
    "x-ibm-name": string;
    title: string;
    version: string;
  };
}

type CascadingFiltersProps = {
  title: string;
  idPrefix: string;

  // Controlled values (come from MainContent)
  apicVersion: ApicVersion;
  environment: Environment;
  catalog: Catalog;
  /** Holds the selected API **id** (not the title). */
  apiName: string;
  yaml: string;

  // Data/loading/error derived in MainContent
  apis: ReadonlyArray<ApiItem> | undefined;
  isLoading: boolean;
  error: unknown;

  // Updaters from MainContent (handle cascading resets there)
  onChangeVersion: (v: ApicVersion) => void;
  onChangeEnvironment: (e: Environment) => void;
  onChangeCatalog: (c: Catalog) => void;
  onChangeApiName: (name: string) => void;
  onChangeYaml: (yaml: string) => void;
};

/* ---------- Reusable cascading filter bar (STATELESS) ---------- */
function CascadingFilters({
  title,
  idPrefix,
  apicVersion,
  environment,
  catalog,
  apiName,
  yaml,
  apis,
  isLoading,
  error,
  onChangeVersion,
  onChangeEnvironment,
  onChangeCatalog,
  onChangeApiName,
  onChangeYaml,
}: CascadingFiltersProps) {
  const parentsChosen = Boolean(apicVersion && environment && catalog);

  const environmentOptions = React.useMemo(() => {
    if (!apicVersion) return [];
    return ENVIRONMENTS_BY_VERSION[apicVersion].map((v) => ({ value: v, label: v }));
  }, [apicVersion]);

  const catalogOptions = React.useMemo(() => {
    if (!apicVersion || !environment) return [];
    const byEnv = CATALOGS_BY_VERSION_ENV[apicVersion][environment as Exclude<Environment, "">];
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
        <label htmlFor={`${idPrefix}-yaml`} className="text-sm font-medium text-gray-700">
          {title}
        </label>

        {/* APIC Version */}
        <div className="flex flex-col">
          <label htmlFor={`${idPrefix}-apic-version`} className="mb-1 text-xs font-medium text-gray-700">
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
          <label htmlFor={`${idPrefix}-environment`} className="mb-1 text-xs font-medium text-gray-700">
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
          <label htmlFor={`${idPrefix}-catalog`} className="mb-1 text-xs font-medium text-gray-700">
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
          <label htmlFor={`${idPrefix}-api-name`} className="mb-1 text-xs font-medium text-gray-700">
            API Name
          </label>
          <SearchableDropdown
            id={`${idPrefix}-api-name`}
            value={apiName}
            onChange={onChangeApiName}
            options={apiNameOptions}
            placeholder={apiNamePlaceholder}
            disabled={!parentsChosen || isLoading}
          />
          {error && (
            <p className="mt-1 text-xs text-red-600">
              {(error as Error)?.message ?? "Failed to load APIs."}
            </p>
          )}
        </div>
      </div>

      <textarea
        id={`${idPrefix}-yaml`}
        placeholder={`Paste YAML (${title.toLowerCase()})`}
        className="min-h-[40dvh] w-full resize-y rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        value={yaml}
        onChange={(e) => onChangeYaml(e.target.value)}
      />
    </div>
  );
}

/* ---------- Page ---------- */
export default function MainContent() {
  // Left states
  const [leftVersion, setLeftVersion] = React.useState<ApicVersion>("");
  const [leftEnv, setLeftEnv] = React.useState<Environment>("");
  const [leftCatalog, setLeftCatalog] = React.useState<Catalog>("");
  const [leftApi, setLeftApi] = React.useState(""); // holds selected API id
  const [leftYaml, setLeftYaml] = React.useState("");

  // Right states
  const [rightVersion, setRightVersion] = React.useState<ApicVersion>("");
  const [rightEnv, setRightEnv] = React.useState<Environment>("");
  const [rightCatalog, setRightCatalog] = React.useState<Catalog>("");
  const [rightApi, setRightApi] = React.useState(""); // holds selected API id
  const [rightYaml, setRightYaml] = React.useState("");

  // Fetch API list using lifted selections
  const leftQuery = useApic({ version: leftVersion, environment: leftEnv, catalog: leftCatalog });
  const rightQuery = useApic({ version: rightVersion, environment: rightEnv, catalog: rightCatalog });

  // Fetch API DETAILS as soon as an ID is chosen (declarative)
  const leftDetail = useApiDetail(leftApi, true);   // useMock=true for now
  const rightDetail = useApiDetail(rightApi, true);

  // Cascading resets live *here*
  const onLeftVersion = (v: ApicVersion) => {
    setLeftVersion(v);
    setLeftEnv("");
    setLeftCatalog("");
    setLeftApi(""); // clear selected API id
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

  const canCompare =
    !!leftApi &&
    !!rightApi &&
    !leftDetail.isLoading &&
    !rightDetail.isLoading &&
    !leftDetail.error &&
    !rightDetail.error;

  return (
    <div className="w-full">
      <section id="editors" aria-labelledby="editors-title" className="space-y-3">
        <h2 id="editors-title" className="sr-only">Editors</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: its own independent filter state */}
          <CascadingFilters
            title="Left YAML"
            idPrefix="left"
            apicVersion={leftVersion}
            environment={leftEnv}
            catalog={leftCatalog}
            apiName={leftApi}           // holds id
            yaml={leftYaml}
            apis={leftQuery.data as ReadonlyArray<ApiItem> | undefined}
            isLoading={!!leftQuery.isLoading}
            error={leftQuery.error}
            onChangeVersion={onLeftVersion}
            onChangeEnvironment={onLeftEnv}
            onChangeCatalog={onLeftCatalog}
            onChangeApiName={setLeftApi} // sets id
            onChangeYaml={setLeftYaml}
          />

          {/* RIGHT: a second independent instance (reuses the same component) */}
          <CascadingFilters
            title="Right YAML"
            idPrefix="right"
            apicVersion={rightVersion}
            environment={rightEnv}
            catalog={rightCatalog}
            apiName={rightApi}          // holds id
            yaml={rightYaml}
            apis={rightQuery.data as ReadonlyArray<ApiItem> | undefined}
            isLoading={!!rightQuery.isLoading}
            error={rightQuery.error}
            onChangeVersion={onRightVersion}
            onChangeEnvironment={onRightEnv}
            onChangeCatalog={onRightCatalog}
            onChangeApiName={setRightApi} // sets id
            onChangeYaml={setRightYaml}
          />
        </div>
      </section>

      {/* Optional: tiny inline status so users know details are prefetched */}
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
        <div>
          {leftApi
            ? leftDetail.isLoading
              ? "Left: Loading details…"
              : leftDetail.error
              ? `Left: ${(leftDetail.error as Error).message}`
              : `Left: ${leftDetail.data?.info.title} ready`
            : "Left: no API selected"}
        </div>
        <div>
          {rightApi
            ? rightDetail.isLoading
              ? "Right: Loading details…"
              : rightDetail.error
              ? `Right: ${(rightDetail.error as Error).message}`
              : `Right: ${rightDetail.data?.info.title} ready`
            : "Right: no API selected"}
        </div>
      </div>

      <section id="actions" aria-labelledby="actions-heading" className="mt-6 flex items-center justify-center">
        <h2 id="actions-heading" className="sr-only">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canCompare}
            onClick={() => {
              // Details are already fetched and cached:
              console.log("LEFT DETAIL", leftDetail.data);
              console.log("RIGHT DETAIL", rightDetail.data);
              // TODO: do your diff/compare here
            }}
          >
            {canCompare ? "Compare" : "Loading…"}
          </button>
        </div>
      </section>
    </div>
  );
}
