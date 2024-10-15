
const Clocks = ["🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛"];

module.exports = {
    name: "loading",
    render: function (h) {
        return h("span", {}, Clocks[this.clockIndex])
    },
    methods: {
        $start() {
            this.isRuning = true;
        },
        $stop () {
            this.isRuning = false;
        }
    },
    watch: {
        isRuning(nv) {
            if (nv) {
                let _this = this;
                window.requestAnimationFrame(function _frame () {
                    if (Date.now() - _this.lastIndexTime >= 30) {
                        if (_this.clockIndex + 1 >= Clocks.length) {
                            _this.clockIndex = 0;
                        } else {
                            _this.clockIndex = _this.clockIndex + 1;
                        }
                        _this.lastIndexTime = Date.now();
                    }
                    if (_this.isRuning) {
                        window.requestAnimationFrame(_frame);
                    }
                });
            }
        },
        clockIndex (newvalue) {
            this.$el.innerText = Clocks[newvalue];
        }
    },
    data: {
        isRuning: false,
        lastIndexTime: 0,
        clockIndex: 0
    }
};
