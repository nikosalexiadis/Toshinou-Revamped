class Api {
  constructor() {
    this._blackListedBoxes = [];
    this.gates = [];
    this.boxes = {};
    this.ships = {};
    this.battlestation = null;
    this.lastMovement = 0;
    this.isDisconnected = false;
    this.disconnectTime = null;
    this.reconnectTime = null;

    /*this.maps = { //[id, X, Y]
      1 : {X : 21000, Y : 13100}, //1-1
      2 : {X : 21000, Y : 13100}, //1-2
      3 : {X : 21000, Y : 13100}, //1-3
      4 : {X : 21000, Y : 13100}, //1-4
      13 : {X : 21000, Y : 13100}, //4-1

      5 : {X : 21000, Y : 13100}, //2-1
      6 : {X : 21000, Y : 13100}, //2-2
      7 : {X : 21000, Y : 13100}, //2-3
      8 : {X : 21000, Y : 13100}, //2-4
      14 : {X : 21000, Y : 13100}, //4-2

      9 : {X : 21000, Y : 13100}, //3-1
      10 : {X : 21000, Y : 13100}, //3-2
      11 : {X : 21000, Y : 13100}, //3-3
      12 : {X : 21000, Y : 13100}, //3-4
      15 : {X : 21000, Y : 13100}, //4-3

      16 : {X : 42000, Y : 26200}, //4-4
      29 : {X : 42000, Y : 26200}, //4-5

      17 : {X : 21000, Y : 13100}, //1-5
      18 : {X : 21000, Y : 13100}, //1-6
      19 : {X : 21000, Y : 13100}, //1-7
      20 : {X : 21000, Y : 13100}, //1-8

      21 : {X : 21000, Y : 13100}, //2-5
      22 : {X : 21000, Y : 13100}, //2-6
      23 : {X : 21000, Y : 13100}, //2-7
      24 : {X : 21000, Y : 13100}, //2-8

      25 : {X : 21000, Y : 13100}, //3-5
      26 : {X : 21000, Y : 13100}, //3-6
      27 : {X : 21000, Y : 13100}, //3-7
      28 : {X : 21000, Y : 13100}, //3-8

      91 : {X : 42000, Y : 26200}, //5-1
      92 : {X : 21000, Y : 13100}, //5-2
      93 : {X : 42000, Y : 26200}, //5-3
    };*/
  }

  lockShip(ship) {
    if (!(ship instanceof Ship))
      return;

    if (this.ships[ship.id] == null)
      return;

    ship.update();
    let pos = ship.position;
    let scr = 'document.getElementById("preloader").lockShip(' + ship.id + ',' + Math.round(pos.x) + ',' + Math.round(pos.y) + ',' + Math.round(window.hero.position.x) + ',' + Math.round(window.hero.position.y) + ');';
    Injector.injectScript(scr);

    this.lockTime = $.now();
  }

  lockNpc(ship) {
    if (!(ship instanceof Ship))
      return;

    if (this.ships[ship.id] == null)
      return;

    this.lockTime = $.now();

    this.lockShip(ship);
  }

  reconnect() {
      let scr = 'document.getElementById("preloader").reconnect();';
      Injector.injectScript(scr);
      
      this.reconnectTime = $.now();
  }

  collectBox(box) {
    if (!(box instanceof Box))
      return;

    if (this.boxes[box.hash] == null)
      return;

    if (MathUtils.random(1, 100) >= window.settings.collectionSensitivity) {
      return;
    }

    Injector.injectScript('document.getElementById("preloader").collectBox' + box.hash + '()');

    this.collectTime = $.now();
  }

  move(x, y) {
    if (!isNaN(x) && !isNaN(y)) {
      window.hero.move(new Vector2D(x, y));
    }
  }

  blackListHash(hash) {
    this._blackListedBoxes.push(hash);
  }

  isOnBlacklist(hash) {
    return this._blackListedBoxes.includes(hash);
  }

  startLaserAttack() {
    Injector.injectScript('document.getElementById("preloader").laserAttack()');
  }

  findNearestBox() {
    let minDist = 100000;
    let finalBox;

    if (!window.settings.bonusbox && !window.settings.matherials && !window.settings.palladium && !window.settings.cargobox && !window.settings.booty && !window.settings.rbooty && !window.settings.bbooty && !window.settings.msqbooty)
      return {
        box: null,
        distance: minDist
      };

    for (let property in this.boxes) {
      let box = this.boxes[property];
      let dist = box.distanceTo(window.hero.position);
      if (dist < minDist) {
        if (!box.isResourse() && ((box.isCollectable() && window.settings.bonusbox) ||
            ((box.isMaterial() || box.isDropRes()) && window.settings.matherials) ||
            (box.isPalladium() && window.settings.palladium) ||
            (box.isCargo() && window.settings.cargobox) ||
            (box.isBooty() && window.settings.booty && window.count > 0) ||
            (box.isRBooty() && window.settings.rbooty && window.rcount > 0) ||
            (box.isBBooty() && window.settings.bbooty && window.bcount > 0) ||
            (box.isMSQBooty() && window.settings.msqbooty && window.msqbcount > 0))) {
          finalBox = box;
          minDist = dist;
        }
      }
    }
    return {
      box: finalBox,
      distance: minDist
    };
  }

  findNearestShip() {
    let minDist = 100000;
    let finalShip;

    if (!window.settings.killNpcs)
      return {
        ship: null,
        distance: minDist
      };

    for (let property in this.ships) {
      let ship = this.ships[property];
      ship.update();
      let dist = ship.distanceTo(window.hero.position);

      if (dist < minDist) {
        if (ship.isNpc && window.settings.getNpc(ship.name) && !ship.isAttacked) {
          finalShip = ship;
          minDist = dist;
        }
      }
    }

    return {
      ship: finalShip,
      distance: minDist
    };
  }

  findNearestGate() {
    let minDist = 100000;
    let finalGate;

    this.gates.forEach(gate => {
      let dist = window.hero.distanceTo(gate.position);
      if (dist < minDist && gate.gateId != 150000450 && gate.gateId != 150000451 && gate.gateId != 150000449) {
        finalGate = gate;
        minDist = dist;
      }
    });

    return {
      gate: finalGate,
      distance: minDist
    };
  }

  findNearestGateForRunAway(enemy) {
    let minDist = 100000;
    let finalGate;
    this.gates.forEach(gate => {
      let enemeyDistance = enemy.distanceTo(gate.position);
      let dist = window.hero.distanceTo(gate.position);
      if (enemeyDistance < dist) {
        return;
      }
      if (dist < minDist && gate.gateId != 150000450 && gate.gateId != 150000451 && gate.gateId != 150000449) {
        finalGate = gate;
        minDist = dist;
      }
    });

    return {
      gate: finalGate,
      distance: minDist
    };
  }

  findNearestGatebyID(gate_id) {
    let minDist = 100000;
    let finalGate;

    this.gates.forEach(gate => {
      let dist = window.hero.distanceTo(gate.position);
      if (dist < minDist && gate.Gatetype == gate_id) {
        finalGate = gate;
        minDist = dist;
      }
    });

    return {
      gate: finalGate,
      distance: minDist
    };
  }

  markHeroAsDead() {
    this.heroDied = true;
    Injector.injectScript("window.heroDied = true;");
  }

  CheckForEnemy() {
    let result = {
      run: false,
      enemy: null,
      edist: 100000
    };
    let enemyDistance = 100000;
    let enemyShip;
    for (let property in this.ships) {
      let ship = this.ships[property];
      ship.update();
      if (!ship.isNpc && ship.isEnemy) {
        let dist = ship.distanceTo(window.hero.position);
        if (enemyDistance > dist) {
          enemyDistance = dist;
          result.edist = dist;
          result.enemy = ship;
        }
      }
    }
    if (enemyDistance < 2000) { // 2000 run away detect distance
      result.run = true;
      return result;
    }
    return result;
  }

}
