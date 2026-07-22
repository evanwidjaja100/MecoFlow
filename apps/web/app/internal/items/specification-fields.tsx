import {
  specificationStep,
  type SpecificationAttributeDefinition,
} from "./data";

export function SpecificationFields({
  attributes,
  values = new Map<string, string | boolean>(),
}: {
  attributes: SpecificationAttributeDefinition[];
  values?: ReadonlyMap<string, string | boolean>;
}) {
  const ordered = [...attributes].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );
  return (
    <fieldset className="specification-fields span-all">
      <legend>Structured specifications</legend>
      {ordered.length === 0 ? (
        <p>This category has no specification attributes.</p>
      ) : (
        <div className="specification-grid">
          {ordered.map((attribute) => {
            const name = `specificationValue.${attribute.id}`;
            const value = values.get(attribute.id);
            const qualifier = [
              attribute.required ? "required" : "optional",
              attribute.active ? null : "inactive definition",
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <div key={attribute.id}>
                <input
                  type="hidden"
                  name="specificationAttribute"
                  value={`${attribute.id}|${attribute.dataType}`}
                />
                {attribute.dataType === "BOOLEAN" ? (
                  <label className="checkbox specification-checkbox">
                    <input
                      type="checkbox"
                      name={name}
                      value="true"
                      defaultChecked={value === true || value === "true"}
                    />
                    <span>
                      {attribute.name} ({qualifier})
                    </span>
                  </label>
                ) : (
                  <label>
                    {attribute.name}
                    {attribute.unitOfMeasure
                      ? ` (${attribute.unitOfMeasure.symbol})`
                      : ""}
                    <input
                      name={name}
                      type={attribute.dataType === "NUMBER" ? "number" : "text"}
                      step={
                        attribute.dataType === "NUMBER"
                          ? specificationStep(attribute.decimalPrecision)
                          : undefined
                      }
                      defaultValue={typeof value === "string" ? value : ""}
                      required={attribute.required}
                      maxLength={
                        attribute.dataType === "TEXT" ? 1000 : undefined
                      }
                    />
                    <small>
                      {attribute.code} · {qualifier}
                      {attribute.dataType === "NUMBER" &&
                      attribute.decimalPrecision !== null
                        ? ` · up to ${attribute.decimalPrecision} decimal places`
                        : ""}
                    </small>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
