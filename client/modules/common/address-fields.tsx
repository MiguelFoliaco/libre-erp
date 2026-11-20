import { config, type AddressField, type AddressValues, addressFieldLabels } from "@/config";
import { text, } from "@/modules/language";
import { clsx } from "clsx";






export function emptyAddressValues(): AddressValues {
    return Object.fromEntries(
        config.addressConfig.fields.map((field) => [field, ""]),
    ) as AddressValues;
}

export function parseAddressValues(value: unknown, fallback = ""): AddressValues {
    const values = emptyAddressValues();
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const address = value as Record<string, unknown>;
        for (const field of config.addressConfig.fields) {
            if (typeof address[field] === "string") {
                values[field] = address[field];
            }
        }
    }

    if (fallback && config.addressConfig.fields.every((field) => !values[field])) {
        values[config.addressConfig.order[0]] = fallback;
    }

    return values;
}

export function AddressFields({
    values,
    onChange,
    className = "grid gap-4 sm:grid-cols-2",
    labelClassName
}: {
    values: AddressValues;
    onChange: (field: AddressField, value: string) => void;
    className?: string;
    labelClassName?: string;
}) {
    return (
        <div className={className}>
            {config.addressConfig.order.map((field) => (
                <label className="flex flex-col gap-1" key={field}>
                    <span className={
                        clsx(
                            "label-text text-sm mb-1 ",
                            labelClassName
                        )
                    }>{text(addressFieldLabels[field])}</span>
                    <input
                        className="input input-sm"
                        maxLength={255}
                        required={config.addressConfig.requiredFields.some((requiredField) => requiredField === field)}
                        value={values[field]}
                        onChange={(event) => onChange(field, event.target.value)}
                    />
                </label>
            ))}
        </div>
    );
}
