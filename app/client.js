import Phaser from 'phaser-ce'
import GamePlayer from './game/GamePlayer'
import Player from './game/Player'
import CurrentPlayer from './game/CurrentPlayer'
import Minimap from './game/Minimap'
import CollisionInterface from './game/CollisionInterface'
import Interface from './game/Interface'
import Constants from './game/Constants'
import Utils from './game/utils'
import CharacterLoader from './game/CharacterLoader'
import jQuery from 'jquery'
import Hotkeys from './game/Hotkeys'
import SoundCache from './game/SoundCache'

class Client {
  constructor (game, socket) {
    this.game = game
    this.players = new Phaser.ArraySet()
    this.clientReady = false
    this.socket = socket
    this.groupSprite = game.add.group(undefined, 'allsprite')
    this.enviromentSprite = new Phaser.ArraySet()
    this.minimap = new Minimap(game, 0, 0)
    this.interfaceInstance = new Interface(game)

    this.characterLoader = new CharacterLoader()

    this.data = {}
  }

  init () {
    const {game, groupSprite, minimap, socket, interfaceInstance, enviromentSprite} = this
    const _this = this

    const playerCG = CollisionInterface.addCollisionGroup(game, 'player')
    CollisionInterface.addCollisionGroup(game, 'ally')
    CollisionInterface.addCollisionGroup(game, 'enemy')
    const obstacleCG = CollisionInterface.addCollisionGroup(game, 'obstacle')
    const allySpellCG = CollisionInterface.addCollisionGroup(game, 'allySpell')
    const enemySpellCG = CollisionInterface.addCollisionGroup(game, 'enemySpell')


    let house = game.add.sprite(800,800,'house')


    game.physics.p2.enable(house, true)  
    house.body.addPolygon(
    {
      optimalDecomp: false,
      skipSimpleCheck: true,
      removeCollinearPoints: false,

    },
    [ 293,165 , 168,229 , 53,170 , 179,95 ])

    house.body.static = true

    house.body.setCollisionGroup(obstacleCG)
    house.body.collides([playerCG, allySpellCG, enemySpellCG])

    groupSprite.add(house)
    enviromentSprite.add(house)

    this.socket.emit('on_play')

    this.socket.on('allplayers', function (players) {
      if (players) {
        for (let player of players) {
          let newP = _this.players.getByKey('id', player.id)
          if (newP === null) { _this.addNewPlayer.call(_this, player) }
        }
      }
    })

    this.socket.on('newplayer', function (p) {
      let newP = _this.players.getByKey('id', p.id)
      if (newP === null) {
        _this.addNewPlayer.call(_this, p)
      }
    })

    this.socket.on('playerdisconnect', function (id) {
      let disconnected = _this.players.getByKey('id', id)
      if (disconnected !== null) {
        disconnected.removeSignal()
        disconnected.kill()
        _this.players.remove(disconnected)
        minimap.deletePosition(id)
        interfaceInstance.removeAllyBox(disconnected)
	            // Players.remove(disconnected);
	          }
	        })

    this.socket.on('setupplayer', function (np) {
      _this.clientReady = true
      let character = _this.characterLoader.instanciateCharacter(np.character.name)
      CurrentPlayer.activeSpell = character.getFirstSpell()

      CurrentPlayer.username = np.username
      CurrentPlayer.life = np.life
      CurrentPlayer.initialLife = CurrentPlayer.life
      interfaceInstance.drawUserLife(CurrentPlayer.life,CurrentPlayer.initialLife)
      CurrentPlayer.character = character

      CurrentPlayer.team = np.team
      CurrentPlayer.isAlive = np.isAlive
      CurrentPlayer.socketId = np.socketId
      CurrentPlayer.stats = np.stats;

      CurrentPlayer.setBaseData(np.character)

      CurrentPlayer.onSpellChange.add(function (spell) {
        CurrentPlayer.activeSpell = spell
        interfaceInstance.setActiveSpell(spell)
      })

      let sprite = character.init(game, np.x, np.y, CurrentPlayer)
      CurrentPlayer.sprite = sprite
      groupSprite.add(CurrentPlayer.sprite)


      console.log('this');/*
      */
/*

      let hitboxSprite = CurrentPlayer.sprite.getChildAt(0)
      hitboxSprite.body.setCollisionGroup(playerCG)
      hitboxSprite.body.collides([obstacleCG])
      console.log(hitboxSprite);
*/

      sprite.data.owner = CurrentPlayer
      CurrentPlayer.id = np.id

      minimap.addPlayerCurrent(CurrentPlayer)
      interfaceInstance.initPlayerStat(CurrentPlayer)
      interfaceInstance.initSpellItf(character)

      game.camera.follow(sprite, null, 0.3, 0.3)

      _this.players.add(CurrentPlayer)

      CurrentPlayer.refreshPositionInterval = setInterval(function () {
        if (CurrentPlayer.isAlive == false) { return }

        if (sprite.body.x && sprite.body.y) {
          socket.emit('updateposition', {x: sprite.body.x, y: sprite.body.y})
          minimap.updatePosition(CurrentPlayer)
        }
      }, Constants.REFRESH_POSITION)

      socket.on('gameReady',function(){
        _this.clientReady = true
      })


      socket.on('newRound', function (teamN) {
         _this.clientReady = false
        let msg = `Team ${teamN} won !`
        let baseTime = 5
        _this.interfaceInstance.setRoundMessage(msg,5)
        _this.players.list.forEach(p=>p.stopMove())
        setTimeout(function(){
          _this.interfaceInstance.toggleRoundBg()
          setTimeout(()=>_this.resetRound(), 500 ) // view should be all black by this time
        },baseTime*1000) 
        

        setTimeout(function(){
          _this.interfaceInstance.toggleRoundBg()
          _this.interfaceInstance.setRoundMessage(`Be ready for the round`,5)
          
        },(baseTime+2)*1000);
      })

      socket.on('setposition', function (position) {
        const { hitbox } = CurrentPlayer.sprite.data
        let {x, y} = position
        CurrentPlayer.sprite.body.x = x
        CurrentPlayer.sprite.body.y = y
        hitbox.body.x = x
        hitbox.body.y = y

      })

      CurrentPlayer.latencyInterval = setInterval(function () {
        socket.emit('ping_latency', Date.now())
      }, 10 * 1000)

      socket.on('ping_latency', function (id, latency) {
        let p = id == null ? CurrentPlayer : _this.players.getByKey('id', id)

        if (p) {
          p.stats.latency = latency
          _this.interfaceInstance.setPlayerStat(p, 'latency')
        }
      })

      socket.on('setStatistic', function (statistic) {
        let { kill, death } = statistic
        let player = kill == CurrentPlayer.id ? CurrentPlayer : _this.players.getByKey('id', kill)

        if (player) {
          player.stats.kill++
          _this.interfaceInstance.setPlayerStat(player, 'kill')
        }

        let player2 = death == CurrentPlayer.id ? CurrentPlayer : _this.players.getByKey('id', death)

        if (player2) {
          player2.stats.death++
          _this.interfaceInstance.setPlayerStat(player2, 'death')
        }
      })
      socket.on('castspell', function (id, spellName, target) {
        let p = _this.players.getByKey('id', id)
        if (p !== null) {
          let {x, y} = p.sprite.body
          let cameraCenter = {}
          cameraCenter.x = game.camera.x + game.camera.width / 2
          cameraCenter.y = game.camera.y + game.camera.height / 2

          let tooFar = Utils.distTwoPoints({x, y}, cameraCenter) > 2500
          if (!tooFar) { GamePlayer.castingOther(game, p, p.character.getSpellByName(spellName), target) }
        }
      })

      socket.on('updateposition', function (player) {
        let p = _this.players.getByKey('id', player.id)
        if (p !== null && p.isAlive ) {
          GamePlayer.movementOther(game, p, {x: player.x, y: player.y})
          minimap.updatePosition(p)
        }
      })

      socket.on('updatelife', function (player) {
        let Player = null
        if (player.id == CurrentPlayer.id) {
          Player = CurrentPlayer
        } else {
          Player = _this.players.getByKey('id', player.id)
        }

        if (Player) {
          Player.damage(Player.life - player.life)
          if (Player.ally) { _this.interfaceInstance.setAllyBox(Player) }
        }
      })

      socket.on('setScore', function (score) {
        _this.interfaceInstance.setScore(score)
      })


      socket.on('newmessage', function (username, message) {
        _this.interfaceInstance.addMessage(username, message)
      })
    })

    
  }

  addNewPlayer (np) {
    const _this = this
    let {groupSprite, minimap, interfaceInstance} = this

    let newPlayer = new Player(np.id)

    let character = _this.characterLoader.instanciateCharacter(np.character.name)
    // find the character based on np.character
    newPlayer.character = character
    newPlayer.username = np.username
    newPlayer.sprite = character.init(this.game, np.x, np.y, newPlayer)

    newPlayer.ally = np.team === CurrentPlayer.team ? true : false

    newPlayer.isAlive = np.isAlive
    newPlayer.socketId = np.socketId

    newPlayer.life = np.life
    newPlayer.initialLife = newPlayer.life
    newPlayer.team = np.team
    newPlayer.stats = np.stats;
    newPlayer.setBaseData(np.character)

    groupSprite.add(newPlayer.sprite)

    newPlayer.sprite.data.owner = newPlayer

  //  	newPlayer.sprite.inputEnabled = true
    if( newPlayer.ally === false ) {
    	newPlayer.onHitted.add(function () {
    		if (this == CurrentPlayer.lockOn) { interfaceInstance.drawEnemyBarLife(this.username, this.life, this.initialLife) }
    	}, newPlayer)
    }
  /*  let hitboxSprite = newPlayer.sprite.getChildAt(0)

    hitboxSprite.body.setCollisionGroup(playerCG)
    hitboxSprite.body.collides([playerCG,obstacleCG])*/

/*    newPlayer.sprite.body.onBeginContact.add(function (a) {
        	if (this.body) { this.body.damping = 1 }
    }, newPlayer.sprite)

    newPlayer.sprite.body.onEndContact.add(function (a) {
        	if (this.body) { this.body.damping = 0 }
    }, newPlayer.sprite)*/

    newPlayer.onKilled.add(function () {
        	// if i got him locked i have to remove him
        	if (CurrentPlayer.lockOn == this) 
          { 
            CurrentPlayer.lockOn = null
            interfaceInstance.hideEnemyBarLife()
          }

        	minimap.deletePosition(this.id)
      // _this.players.remove(this);
    }, newPlayer)
/*
    newPlayer.onSpellTouchEnemy.add(function (callerId, calledId, spell) {
	   })*/

    newPlayer.onFootStep.add(function() {

      let { body } = this.sprite
      let {x, y} = body
      let myPos = {}
      myPos.x = CurrentPlayer.sprite.body.x
      myPos.y = CurrentPlayer.sprite.body.y

      // 0.05 vol for 1000px
      let dist = Utils.distTwoPoints( {x,y}, myPos )

      if( dist > 600 ) return

      let volume = 0;
      if( dist < 100 ) {
        volume = Constants.MAX_VOL_OTHERS_FOOTSTEP
      } else {
        volume = 1 / ( dist * Constants.MAX_VOL_OTHERS_FOOTSTEP / 100 )
      }
      

      SoundCache.play('general','footstep', volume)
    }.bind(newPlayer) )

    this.players.add(newPlayer)
    minimap.addPlayerOther(newPlayer)

    if (newPlayer.ally == true) {
        	interfaceInstance.setAllyBox(newPlayer)
    }
    interfaceInstance.initPlayerStat(newPlayer)

    newPlayer.stopMove()

    return newPlayer
  }

  resetRound(){
    const { socket, minimap, groupSprite , players, interfaceInstance} = this;

    this.clientReady = false

    players.list.forEach(player=>{
      if( player.id !== CurrentPlayer.id ) player.removeSignal()
    });
    players.removeAll()

    clearInterval(CurrentPlayer.refreshPositionInterval);
    clearInterval(CurrentPlayer.latencyInterval);

    socket.off('newRound');
    socket.off('setposition');
    socket.off('ping_latency');
    socket.off('setStatistic');
    socket.off('castspell');
    socket.off('updateposition');
    socket.off('updatelife');
    socket.off('setScore');
    socket.off('newmessage');

    minimap.reset();

    groupSprite.removeAll(false,true);

    interfaceInstance.removePlayerStat()
    interfaceInstance.removeSpellItf()


  }

  initKeyboard () {
    // detect when user press enter

    const { socket, interfaceInstance, minimap } = this
    

    interfaceInstance.initChat(socket)
    const hks = {}
    Object.keys(Constants.DEFAULT_HK).forEach( key => {
      hks[[key]] = Constants.DEFAULT_HK[key]['code']
    })

    Hotkeys.setMultipleIfEmpty(hks)
    interfaceInstance.initHotkeys(Constants.DEFAULT_HK);
   
    jQuery(document).on('keydown', function (e) {
      let code = e.which || e.keyCode

      let event = Hotkeys.getKey(code)

      if( event === null ) {
        if( code === 38 ) event = 'minimap_up'
        else if( code === 40 ) event = 'minimap_bottom'
        else if( code === 37 ) event = 'minimap_left'
        else if( code === 39 ) event = 'minimap_right'
        else if( code === 72 ) event = 'toggle_hotkeys'
        else return
      }

      switch (event) {
        case 'minimap_up': // up
          e.preventDefault()
          minimap.offsetMinimap(0,-5)
          break;
        case 'minimap_bottom': // bottom
          e.preventDefault()
          minimap.offsetMinimap(0,5)
          break;
        case 'minimap_left': // left
          e.preventDefault()
          minimap.offsetMinimap(-5,0)
          break;
        case 'minimap_right': // right
          e.preventDefault()
          minimap.offsetMinimap(5,0)
          break;
        case 'toggle_score':
          // tab
          e.preventDefault()

          interfaceInstance.toggleStatistic()

          break
        case 'toggle_hotkeys': // h
          interfaceInstance.toggleHotkeys();
          break
        case 'spell_1':
        case 'spell_2':
        case 'spell_3':
        case 'spell_4':
          if( CurrentPlayer.isAlive === true ) {
            let spell = CurrentPlayer.character.getSpellByEvent( event )
            if( spell )
              CurrentPlayer.onSpellChange.dispatch( spell )
          }
          break
      }
    })

  }
}

export default Client
