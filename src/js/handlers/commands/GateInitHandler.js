class GateInitHandler {
  static get ID() {
    return 7257;
  }

  constructor() {
    this._handler = function (e, a) {
      let parsedJson = JSON.parse(e.detail);
      
      a.gates.push(new Gate(parsedJson.x, parsedJson.y, parsedJson.factionId, parsedJson[Variables.gateJumpId], parsedJson[Variables.Gatetype]));
    }
  }

  get handler() {
    return this._handler;
  }
}