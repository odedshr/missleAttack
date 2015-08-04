var MissileAttack = MissileAttack || (function missleAttackClosure () {
    return {
        dWrapper : false,
        dBuildings : false,
        dCannon : false,
        dHits : false,
        dAccuracy : false,
        wrapperWidth : 0,
        wrapperHeight : 0,
        missileSpeed : 0.01, //=100 ticks for missile to hit
        patriotStep: 20, //=20px diagonally
        missileRate : 97,
        missileId: 0,
        patriotId : 0,
        buildings: [],
        missiles : [],
        patriots : [],
        explosions : [],
        oStats : { iMissiles : 0, iPatriots : 0, iHits : 0},
        isPlaying : false,
        shootMissile : function shootMissile() {
            var missileId = this.missileId++,
                dElement = document.createElement("DIV"),
                missile = {
                    id: missileId,
                    fromX: (Math.random() * this.wrapperWidth * 0.9) + this.wrapperWidthPadding,
                    toX: (Math.random() * this.wrapperWidth * 0.9) + this.wrapperWidthPadding,
                    y: 0
                };
            this.missiles.push(missile);
            dElement.className = "missile";
            dElement.id = "missile-"+missileId;
            dElement.style.top = 0;
            dElement.style.left = missile.fromX +"px";
            dElement.style.transform = "rotate("+(Math.atan2(missile.fromX-missile.toX,this.wrapperHeight))+"rad)";
            this.dWrapper.appendChild(dElement);
            missile.elm = dElement;
            this.oStats.iMissiles++;
        },
        removeMissile: function removeMissile (missle) {
            this.dWrapper.removeChild(missle.elm);
            this.missiles.splice(this.missiles.indexOf(missle),1);
        },
        shootPatriot : function shootPatriot (ev) {
            if (this.isPlaying && (ev.path.indexOf(this.dBuildings)==-1)) {
                var distanceX =ev.layerX -  (this.wrapperWidth/2),
                    distanceY = this.wrapperHeight - ev.layerY,
                    angle = Math.atan2(distanceY,distanceX);
                var patriotId = this.patriotId++,
                    dElement = document.createElement("DIV"),
                    patriot = {
                        id: patriotId,
                        x:  (this.wrapperWidth/2),
                        toX: ev.layerX,
                        toY: ev.layerY,
                        y: this.wrapperHeight,
                        stepY: -this.patriotStep * Math.sin(angle),
                        stepX: this.patriotStep * Math.cos(angle)
                    };
                this.patriots.push(patriot);
                dElement.className = "patriot";
                dElement.id = "patriot-"+patriotId;
                dElement.style.transform = "rotate("+(Math.atan2(distanceX,distanceY))+"rad)";
                dElement.style.top = patriot.y +"px";
                dElement.style.left = "0px";
                this.dWrapper.appendChild(dElement);
                patriot.elm = dElement;
                this.oStats.iPatriots++;
            }
        },
        explode : function explode (x, y) {
            var dElement = document.createElement("DIV"),
                explosion = {
                    x: x,
                    y: y,
                    t: 10
                };
            this.explosions.push(explosion);
            dElement.className = "explosion";
            this.dWrapper.appendChild(dElement);
            explosion.elm = dElement;
            explosion.elm.style.top = explosion.y +"px";
            explosion.elm.style.left = explosion.x +"px";
        },
        isIntersects : function isIntersects (dElm1, dElm2) {
            return !(
                ((dElm1.offsetTop + dElm1.clientHeight) < (dElm2.offsetTop)) ||
                (dElm1.offsetTop > (dElm2.offsetTop + dElm2.clientHeight)) ||
                ((dElm1.offsetLeft + dElm1.clientWidth) < dElm2.offsetLeft) ||
                (dElm1.offsetLeft > (dElm2.offsetLeft + dElm2.clientWidth))
            );
        },
        updateCannonRotation : function updateCannonRotation (ev) {
            if ((ev.path.indexOf(this.dWrapper)>-1) && (ev.path.indexOf(this.dBuildings)==-1)) {
                var distanceX =ev.layerX -  (this.wrapperWidth/2),
                    distanceY = this.wrapperHeight - ev.layerY;

                this.dCannon.style.transform = "rotate("+(Math.atan2(distanceX,distanceY))+"rad)";
            }
        },

        updateStats : function updateStats (ev) {
            this.dHits.value = this.oStats.iHits;
            this.dAccuracy.value = (this.oStats.iHits / this.oStats.iPatriots).toFixed(2);
        },

        onIdle : function onIdle (ev) {
            try {
                var that = this;
                if (this.isPlaying) {
                    this.patriots.forEach(function perPatriot (patriot,index) {
                        patriot.y += patriot.stepY;
                        patriot.x += patriot.stepX;
                        patriot.elm.style.top = patriot.y+"px";
                        patriot.elm.style.left = patriot.x+"px";
                        if (patriot.y <= patriot.toY) {
                            that.dWrapper.removeChild(patriot.elm);
                            that.patriots.splice(index,1);
                            that.explode(patriot.x,patriot.y);
                        }
                    });
                    this.explosions.forEach(function perExplosion(explosion,index) {
                        if (--explosion.t == 0) {
                            that.dWrapper.removeChild(explosion.elm);
                            that.explosions.splice(index,1);
                        }
                    });
                    this.missiles.forEach(function perMissile (missile) {
                        missile.y += that.missileSpeed*that.wrapperHeight;
                        missile.x = missile.fromX + (missile.y/that.wrapperHeight)*(missile.toX-missile.fromX);
                        missile.elm.style.top = missile.y+"px";
                        missile.elm.style.left = missile.x+"px";
                        that.explosions.forEach(function perExplosion(explosion) {
                            if (that.isIntersects(missile.elm,explosion.elm)) {
                                that.removeMissile.call(that,missile);
                                that.oStats.iHits++;
                            }
                        });
                        if (that.isIntersects(missile.elm,that.dBuildings)) {
                            that.buildings.forEach(function perBuilding (building,index) {
                                if (that.isIntersects(missile.elm,building)) { //note I'm sending building and not building.elm
                                    building.elm.className += " burned";
                                    that.buildings.splice(index,1);
                                    that.removeMissile.call(that,missile);
                                    if (that.buildings.length==0) {
                                        that.endGame.call(that);

                                    }
                                }
                            });
                        }
                        if (missile.y > that.wrapperHeight) {
                            that.removeMissile.call(that,missile);
                        }
                    });
                    if (Math.random()*this.missileRate > 95) {
                        this.shootMissile();
                    }
                    this.updateStats(ev);
                }
            }
            catch (err) {
                this.isPlaying = false;
                console.log(err);
            }
        },
        addBuildings : function addBuildings () {
            var newBuildings = "",
                buildingCount = 0,
                totalBuildingsWidth = 0;

            while (totalBuildingsWidth < this.wrapperWidth) {
                var buildingHeight = parseInt(this.wrapperHeight*(0.1+((Math.random()*0.1)))),
                    buildingWidth = parseInt(this.wrapperWidth*(0.1+((Math.random()*0.1))));
                if ((totalBuildingsWidth+buildingWidth)>this.wrapperWidth) {
                    buildingWidth = this.wrapperWidth - totalBuildingsWidth;
                }
                totalBuildingsWidth += buildingWidth;
                newBuildings += "<li id='building-"+(++buildingCount)+"' class='building building"+(1+parseInt(Math.random()*10))+"' style='height:"+buildingHeight+"px;width:"+buildingWidth+"px'></li>";
            }
            this.dBuildings.innerHTML = newBuildings;
            this.buildings = [];
            var buildTopOffset = this.dBuildings.offsetTop + this.dBuildings.clientHeight;
            while (buildingCount) {
                var dElm = document.getElementById("building-"+buildingCount--);
                this.buildings.push({
                    elm:dElm,
                    clientHeight: dElm.clientHeight,
                    clientWidth: dElm.clientWidth,
                    offsetLeft: dElm.offsetLeft,
                    offsetTop: buildTopOffset - dElm.clientHeight + dElm.offsetTop
                });
            }
        },
        startGame : function startGame () {
            var that = this;
            this.dWrapper.className += " playing";
            this.wrapperHeight = that.dWrapper.offsetHeight;
            this.wrapperWidth = that.dWrapper.offsetWidth;
            this.wrapperWidthPadding = that.wrapperWidth*0.05;
            this.addBuildings();

            this.oStats = {
                iMissiles : 0,
                iPatriots : 0,
                iHits : 0
            };
            window.setTimeout(function () {
                that.isPlaying = true;
            },1000);

        },
        endGame : function endGame () {
            var that = this;
            this.patriots.forEach(function perPatriot(patriot) {
                that.dWrapper.removeChild(patriot.elm);
            });
            this.patriots = [];
            this.missiles.forEach(function perMissle(missile) {
                that.dWrapper.removeChild(missile.elm);
            });
            this.missiles = [];
            alert ("Game over!");
            this.isPlaying = false;
            this.dWrapper.className = this.dWrapper.className.replace(/ playing/,"");
        },
        init : function init (wrapperName) {
            var that = this,
                dElement;
            this.initCSS();
            window.setInterval(this.onIdle.bind(this), 50);
            this.dWrapper = document.getElementById(wrapperName);
            this.dWrapper.className += "missileAttack";
            this.dWrapper.onclick = this.shootPatriot.bind(that);

            dElement  = document.createElement("ul");
            dElement.className = "stats";
            dElement.innerHTML = '<li class="stat hits"><label for="hits" class="stat-label">Hits</label><input type="number" readonly="readonly" class="stat-value" name="hits" id="hits"/></li>'+
                                 '<li class="stat accuracy"><label for="accuracy" class="stat-label">Accuracy</label><input type="number" readonly="readonly" class="stat-value" id="accuracy" name="accuracy"/></li>';
            this.dWrapper.appendChild(dElement);
            this.dHits = document.getElementById("hits");
            this.dAccuracy = document.getElementById("accuracy");

            dElement = document.createElement("button");
            dElement.className = "btnPlay";
            dElement.innerHTML = "<span>PLAY!</span>";
            dElement.onclick = this.startGame.bind(this);
            this.dWrapper.appendChild(dElement);

            dElement = document.createElement("div");
            dElement.className = "turret";
            dElement.innerHTML = '<div id="cannon" class="cannon"></div><div class="turret-base"></div>';
            this.dWrapper.appendChild(dElement);
            this.dCannon = document.getElementById("cannon");
            document.onmousemove = this.updateCannonRotation.bind(this);

            this.dBuildings = document.createElement("ul");
            this.dBuildings.className = "buildings";
            this.dWrapper.appendChild(this.dBuildings);
        },
        initCSS : function initCSS () {
            var cssId = 'missleAttackCSS';  // you could encode the css path itself to generate id..
            if (!document.getElementById(cssId)) {
                var link  = document.createElement('link');
                link.id   = cssId;
                link.rel  = 'stylesheet';
                link.type = 'text/css';
                link.href = 'stylesheets/missileAttack.min.css';
                link.media = 'all';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
        }
    };
})();