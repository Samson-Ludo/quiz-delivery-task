export const parseClientId = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return trimmed;
};
export const parseNonNegativeInt = (value) => {
    if (typeof value !== "string" && typeof value !== "number") {
        return null;
    }
    const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
        return null;
    }
    return parsed;
};
