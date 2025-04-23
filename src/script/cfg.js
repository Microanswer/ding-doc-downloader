const prefix = "dddd-";

function key(k) {
    return prefix + k;
}

function getCfg(k, defaultValue) {
    let v = localStorage.getItem(key(k));
    if (typeof v === "undefined" || v === null) {
        return defaultValue;
    }
    return v;
}

function setCfg(k, v) {
    localStorage.setItem(key(k), v);
}

module.exports = {
    getCfg,
    setCfg,

    CFG_KEY: {
        EXPORT_ADOC_AS: "export_adoc_as",
        EXPORT_AXLS_AS: "export_axls_as",
        EXPORT_ADRAW_AS: "export_adraw_as",
        EXPORT_AMIND_AS: "export_amind_as",
    }
}