class Predicate {
    field;
    action;
    value;
    operator;
    not = false;
    left = 0;
    right = 0;

    constructor(field, action, operator, value){
        this.field = field;
        this.action = action;
        this.operator = operator;
        this.value = value;
    }
}