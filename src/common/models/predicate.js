class Predicate {
    constructor(field, action, operator, value, not = false, left = 0, right = 0){
        this.field = field;
        this.action = action;
        this.operator = operator;
        this.value = value;
        this.not = not;
        this.left = left;
        this.right = right;
    }

    expression(token, funcGetter, actionGetter){
        let leftP = '';
        let rightP = '';
        for (let i = 0; i < this.right; i++){
            rightP +=')'
        }
        for (let i = 0; i < this.left; i++){
            leftP +='(';
        }
        if(this.not){
            rightP += ')'
            leftP +='!(';
        }
        const op = funcGetter(this.operator, false);
        const action = funcGetter(this.action, true);
        const exp = actionGetter(action,`${token}["${this.field}"]`,this.value);
        return `${leftP}${exp}${rightP} ${op} `;
    }

    static create(predicate, valueTyper) {
        const {field, action, operator, value, not, left, right} = predicate
        const p = new Predicate(field,action,operator,value,not,left,right);
        p.value = valueTyper(p.value);
        return p;
    }
}

module.exports = Predicate;