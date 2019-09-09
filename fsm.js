class FSM {
    constructor() {
        this._result = [{}];
        this._tempElement = null;
        this._tempNumber = null;
        this._currentState = "initial";

        this._transitionMatrix = {
            initial: {
                transitions: {
                    element: {
                        nextState: "elementArrived",
                    },
                },
            },
            elementArrived: {
                transitions: {
                    element: {
                        nextState: "elementArrived",
                        action: () => {
                            this.updateResultOnTop(this._tempElement);
                        },
                    },
                    number: {
                        nextState: "numberArrived",
                    },
                    openBrace: {
                        nextState: "openBraceArrived",
                        action: () => {
                            this.updateResultOnTop(this._tempElement);
                        },
                    },
                    closeBrace: {
                        nextState: "closeBraceArrived",
                        action: () => {
                            this.updateResultOnTop(this._tempElement);
                        },
                    },
                    eof: {
                        nextState: "final",
                        action: () => {
                            this.updateResultOnTop(this._tempElement);
                        },
                    },
                },
                onEntry: (element) => {
                    this._tempElement = element;
                },
            },
            numberArrived: {
                transitions: {
                    element: {
                        nextState: "elementArrived",
                        action: () => {
                            this.updateResultOnTop(this._tempElement, this._tempNumber);
                        },
                    },
                    openBrace: {
                        nextState: "openBraceArrived",
                        action: () => {
                            this.updateResultOnTop(this._tempElement, this._tempNumber);
                        },
                    },
                    closeBrace: {
                        nextState: "closeBraceArrived",
                        action: () => {
                            this.updateResultOnTop(this._tempElement, this._tempNumber);
                        },
                    },
                    eof: {
                        nextState: "final",
                        action: () => {
                            this.updateResultOnTop(this._tempElement, this._tempNumber);
                        },
                    },
                },
                onEntry: (number) => {
                    this._tempNumber = number;
                },
            },
            openBraceArrived: {
                transitions: {
                    element: {
                        nextState: "elementArrived",
                    },
                },
                onEntry: () => {
                    this.createEmptyObjectOnStack();
                },
            },
            closeBraceArrived: {
                transitions: {
                    element: {
                        nextState: "elementArrived",
                        action: () => {
                            this.collapseTop();
                        },
                    },
                    number: {
                        nextState: "closeBraceArrived",
                        action: number => {
                            this.multiplyResult(number);
                        },
                    },
                    closeBrace: {
                        nextState: "closeBraceArrived",
                        action: () => {
                            this.collapseTop();
                        },
                    },
                    eof: {
                        nextState: "final",
                        action: () => {
                            this.collapseTop();
                        },
                    },
                },
            },
            final: {},
        };
    }

    transition(ev, val) {
        if (this._transitionMatrix[this._currentState]) {
            let stateObject = this._transitionMatrix[this._currentState];

            if (stateObject.transitions) {
                const transitions = stateObject.transitions;

                if (transitions[ev]) {
                    const eventObject = transitions[ev];

                    if (stateObject.onExit) {
                        stateObject.onExit(val);
                    }

                    if (eventObject.action) {
                        eventObject.action(val);
                    }

                    if (this._transitionMatrix[eventObject.nextState]) {
                        this._currentState = eventObject.nextState;
                        stateObject = this._transitionMatrix[this._currentState];

                        if (stateObject.onEntry) {
                            stateObject.onEntry(val);
                        }
                    } else {
                        throw new Error(
                            `No state for transition from ${this._currentState} to ${eventObject.nextState}`);
                    }
                } else {
                    throw new Error(`No transition for ${ev} in state ${this._currentState}`);
                }
            } else {
                throw new Error(`Transitions for ${this._currentState} is not available`);
            }
        } else {
            throw new Error("Invalid current state", this._currentState);
        }
    }

    updateResultOnTop(tempElement, tempNumber = 1) {
        const stackTop = this._result[this._result.length - 1];
        stackTop[tempElement] = stackTop[tempElement] ?
            stackTop[tempElement] + Number(tempNumber) : Number(tempNumber);
    }

    createEmptyObjectOnStack() {
        this._result.push({});
    }

    collapseTop() {
        const stackTop = this._result.pop();
        const target = this._result[this._result.length - 1];

        for (let element in stackTop) {
            target[element] = target[element] ?
                target[element] + stackTop[element] : stackTop[element];
        }
    }

    multiplyResult(number) {
        const stackTop = this._result[this._result.length - 1];

        for (let element in stackTop) {
            stackTop[element] *= Number(number);
        }
    }

    getResult() {
        return this._result;
    }
};

function parseMolecule(formula) {
    let regexp = new RegExp(
        '(?<element>[A-Z][a-z]?)|(?<number>\\d+)|(?<openBrace>[\\(\\[\\{])|(?<closeBrace>[\\)\\]\\}])', 'g');

    const matchArray = Array.from(formula.matchAll(regexp));

    const result = matchArray.map(el => {
        let key = null;

        for (let val in el.groups) {
            key = el.groups[val] ? val : key;
        }

        return {
            value: el[0],
            key,
        };
    });

    const fsm = new FSM();

    result.forEach((el) => {
        fsm.transition(el.key, el.value);
    });

    fsm.transition("eof");

    return fsm.getResult()[0];
}