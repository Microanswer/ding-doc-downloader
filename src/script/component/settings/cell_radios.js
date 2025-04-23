module.exports = {
    props: {
        title: String,
        name: String,
        defaultValue: String,
        options: Object,
    },
    render(h) {
        return h("li", {class: "dddd-dropdown dddd-dropdown-end"}, [
            h("div", {tabIndex:"0", role:"button", class: "flex flex-row justify-between items-center px-3 py-1 bg-zinc-100 rounded-sm hover:bg-zinc-200"}, [
                h("div", {class: "text-sm"}, this.title),
                h("div", {class: "text-zinc-600"}, [
                    h("span", {class: "text-xs", ref: "valueLabel"}, (this.options || []).find(op => op.value === this.mValue)?.label),
                    h("span", {class: "ml-2 text-lg"}, "›")
                ]),
            ]),
            h("ul", {tabIndex: "0", class: "dddd-dropdown-content dddd-menu bg-base-200 border border-zinc-400 rounded-box w-56 shadow-md"}, this.options.map(op =>
                h("li", {class: "hover:bg-zinc-200 rounded-sm"}, [
                    h("label", {class: "flex flex-row justify-between"}, [
                        op.label,
                        h("input", {
                            type: "radio",
                            name: this.name,
                            class: "radio radio-xs",
                            value: op.value,
                            checked: op.value === this.mValue ? "checked" : "",
                            on: {change: this.onChange}
                        })
                    ])
                ]))
            )
        ]);
    },
    created(){
        this.mValue = this.defaultValue;
    },
    methods: {
        onChange(e){
            this.mValue = e.target.value;
            let newOp = this.options.find(op => op.value === this.mValue);
            this.$refs.valueLabel.textContent = newOp?.label;
            this.$emit("change", newOp);
        }
    },
    data: {
        mValue: this.defaultValue,
    }
}