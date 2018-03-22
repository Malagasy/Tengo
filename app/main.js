import WebFont from 'webfontloader'

import './css/main.scss'
import './css/web.scss'

import ReactDOM from 'react-dom'
import WebApp from './game/Web/App'

import Phaser from 'phaser-ce'
import CurrentPlayer from './game/CurrentPlayer'
import GamePlayer from './game/GamePlayer'
import Client from './client'
import React from 'react'
import SoundCache from './game/SoundCache'

import io from 'socket.io-client'


import _ from 'lodash'

import jQuery from 'jquery'

WebFont.load({
  google: {
    families: ['Lato:400,600', 'Squada One', 'Permanent Marker']
  }
})

window.game = null
window.client = null
window.SocketMain = io.connect('http://localhost:8081')
window.SocketRoom = io.connect('http://localhost:8081/room')
window.SocketLobby = io.connect('http://localhost:8081/lobby')
window.SocketPlay = io.connect('http://localhost:8081/play')

window.initGame = function () {
  window.game = new Phaser.Game(1000, 700, Phaser.AUTO, 'game', { preload, create, update, render })
}
window.initGame()

let WebAppReact = <WebApp SocketMain={window.SocketMain} SocketRoom={window.SocketRoom} SocketLobby={window.SocketLobby} urlWS={'http://localhost:8081'}/>
ReactDOM.render(WebAppReact, document.getElementById('web'))

function preload () {
  window.game.stage.disableVisibilityChange = true
  window.game.time.advancedTiming = true
  window.game.load.image('background', '/assets/ground/grid_example.png')
  window.game.load.image('house', '/assets/environment/barracks.png')
  window.game.load.atlasJSONArray('cowboy', '/assets/chars/cowboy.png', '/assets/chars/cowboy.json')
  window.game.load.atlasJSONArray('sorceress', '/assets/chars/sorceress/atlas.png', '/assets/chars/sorceress/atlas.json')

  //window.game.load.audio('footstep',['/audio/footstep/step.mp3','/audio/footstep/step.ogg'])
  SoundCache.add('general','footstep', ['/audio/footstep/step.wav'] , 0.1 )

  window.game.load.spritesheet('Fireball', 'spell/Sorceress/Fireball/fireball_0.png', 64, 64)
}

function create () {
  jQuery('.in__game').addClass('active')

  window.game.world.setBounds(0, 0, 3168, 1837)

  window.game.physics.startSystem(Phaser.Physics.P2JS)
  window.game.physics.p2.applyGravity = false
  //   game.physics.p2.applyDamping = false;
  window.game.physics.p2.applySpringForce = false

  window.game.add.tileSprite(0, 0, 3168, 1837, 'background')


  window.client = new Client(window.game, window.SocketPlay)
  window.client.initKeyboard()
  window.client.init()

  CurrentPlayer.onSpellCasting.add(function (spell, target) {
    CurrentPlayer.spellCount++
    let spellId = CurrentPlayer.spellCount
    window.client.socket.emit('castspell', spell.path, spellId, target)
  })
  CurrentPlayer.onSpellTouchEnemy.add(function (callerId, calledId, spell, spellId) {
    let enemy = window.client.players.getByKey('id', calledId)
    if( !enemy ) return
    let {x, y} = enemy.sprite.body
    window.client.socket.emit('enemyhit', enemy.socketId, {x, y}, spell.path, spellId)
    // enemy.damage(spell.damage);
  })

  CurrentPlayer.onLockLost.add(function () {
    window.client.interfaceInstance.hideEnemyBarLife()
  })
  CurrentPlayer.onLock.add(function (p) {
      console.log('here');
    window.client.interfaceInstance.drawEnemyBarLife(p.username, p.life, p.initialLife)
  })

  CurrentPlayer.onHitted.add(function () {
    window.client.interfaceInstance.drawUserLife(CurrentPlayer.life, CurrentPlayer.initialLife)
  })

  CurrentPlayer.onKilled.add(function () {
    window.client.interfaceInstance.deleteUserLife()
    window.client.interfaceInstance.removeSpellItf()

    window.client.minimap.deletePosition(CurrentPlayer.id)

    // _this.players.remove(CurrentPlayer);
    let idx = _.findIndex(window.client.players.list, ['isAlive', true])

    if (idx != -1) { window.game.camera.follow(window.client.players.list[idx].sprite, null, 0.5, 0.5) }

  })

  CurrentPlayer.onFootStep.add(function(pos) {
    SoundCache.play('general','footstep')
  })
}

function update () {
  window.client.groupSprite.sort('y')

  if (!window.client.clientReady || !CurrentPlayer.isAlive) { return }


  let playersInGame = _.filter(window.client.players.list, p=>p.isAlive===true && p.id !== CurrentPlayer.id )
  let spritePlayersInGame = _.map(playersInGame, 'sprite')
  let hitboxInGame = _.map( spritePlayersInGame , 'data.hitbox' ) 

  GamePlayer.cursor.call(this, hitboxInGame)
  GamePlayer.movement.call(this, window.client.enviromentSprite.list, spritePlayersInGame)
  GamePlayer.casting.call(this, hitboxInGame)
}

function render () {
  // game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
  jQuery('.performance__fps').text(window.game.time.fps)
}
