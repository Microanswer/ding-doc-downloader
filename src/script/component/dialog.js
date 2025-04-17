const Baby = require("../index");

function Dialog(title, msg, onConfirm) {
    let d = new Baby({
        render(h) {

            let actions = [
                h("button", {class: "dddd-btn dddd-btn-primary text-white", on: {click: this.onConfirmClick}}, "确定")
            ];
            if (onConfirm) {
                actions.push(h("button", {class: "dddd-btn", on: {click: this.onCloseClick}}, "取消"));
            }


            return h("div", { class: "dddd-modal"},[
                h("div", {class: "dddd-modal-box"},[
                    h("h3", {class: "text-lg font-bold"}, title),
                    h("p", {class: "py-4"}, msg),
                    h("div", {class: "dddd-modal-action"}, actions)
                ])
            ])
        },
        mounted(){
        },
        methods: {
            $show(){
                this.$el.setAttribute("open", true);
            },
            $close() {
                this.$el.removeAttribute("open");
                setTimeout(() => {
                    this.$el.remove();
                }, 300)
            },
            onConfirmClick() {
                if (onConfirm) {
                    onConfirm();
                }
                this.$close();
            },
            onCloseClick() {
                this.$close();
            }
        }
    });

    let dom = d.$mount();
    window.document.body.append(dom);
    d.$show();
}

module.exports = {
    dalert(title, msg) {
        Dialog(title, msg);
    },

    dconfirm(title, msg, onConfirm) {
        Dialog(title, msg, onConfirm);
    }
}
