import * as React from "react";
import Dropdown from "../components/ui/Dropdown";
import SearchableDropdown from "./ui/SearchableDropdown";

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

/* ---------- Reusable cascading filter bar ---------- */
function CascadingFilters({
  title,
  idPrefix,
}: {
  title: string;
  idPrefix: string; // helps keep labels/ids unique per side
}) {
  const [apicVersion, setApicVersion] = React.useState<ApicVersion>("");
  const [environment, setEnvironment] = React.useState<Environment>("");
  const [catalog, setCatalog] = React.useState<Catalog>("");
  const [apiName, setApiName] = React.useState("");

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

  // Sample API names — replace with fetch(/apis?version=...&env=...&catalog=...)
  const apiNameOptions = React.useMemo(() => {
    if (!parentsChosen) return [];
    const names = [
      "customer-profile",
      "payments-core",
      "kyc-verify",
      "customer-profile1",
      "payments-core1",
      "kyc-verify1",
      "kyc-verify2",
      "kyc-verify3",
      "kyc-verify4",
      "kyc-verify5",
      "kyc-verify6",
      "kyc-verify7",
      "kyc-verify8",
      "kyc-verify9",
    ];
    return names.map((n) => ({ value: n, label: n }));
  }, [parentsChosen]);

  // Cascading resets
  const onChangeVersion = (v: ApicVersion) => {
    setApicVersion(v);
    setEnvironment("");
    setCatalog("");
    setApiName("");
  };
  const onChangeEnvironment = (e: Environment) => {
    setEnvironment(e);
    setCatalog("");
    setApiName("");
  };
  const onChangeCatalog = (c: Catalog) => {
    setCatalog(c);
    setApiName("");
  };

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
            onChange={setApiName}
            options={apiNameOptions}
            placeholder={
              parentsChosen
                ? "Search API name…"
                : "Select version/env/catalog first…"
            }
            disabled={!parentsChosen}
          />
        </div>
      </div>

      <textarea
        id={`${idPrefix}-yaml`}
        placeholder={`Paste YAML (${title.toLowerCase()})`}
        className="min-h-[40dvh] w-full resize-y rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

/* ---------- Page ---------- */
export default function MainContent() {
  return (
    <div className="w-full">
      <section id="editors" aria-labelledby="editors-title" className="space-y-3">
        <h2 id="editors-title" className="sr-only">Editors</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: its own independent filter state */}
          <CascadingFilters title="Left YAML" idPrefix="left" />

          {/* RIGHT: a second independent instance (reuses the same component) */}
          <CascadingFilters title="Right YAML" idPrefix="right" />
        </div>
      </section>

      <section id="actions" aria-labelledby="actions-heading" className="mt-8 flex items-center justify-center">
        <h2 id="actions-heading" className="sr-only">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Compare
          </button>
        </div>
      </section>
    </div>
  );
}
