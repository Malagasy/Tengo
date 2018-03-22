import jQuery from 'jquery'
import CurrentPlayer from './CurrentPlayer'
import Hotkeys from './Hotkeys'
import Phaser from 'phaser-ce'
import _ from 'lodash'

class Interface {
  constructor (game) {
    this.game = game
    this.statisticDOM = jQuery('#statistic')
    this.hotkeysDOM = jQuery('#hotkeys')
    this.enemyBarDOM = jQuery('#enemy_bar')
    this.alliesBoxDOM = jQuery('.interface_allies')
    this.playerBarDOM = jQuery('#player_bar')
    this.statisticDOM = jQuery('#statistic')
    this.spellDOM = jQuery('#spells')
    this.roundInfoDOM = jQuery('#round_info')
  }

  drawEnemyBarLife (name, currentLife, initialLife) {
    this.enemyBarDOM.find('span').text(name)
    let lifePercent = currentLife * 100 / initialLife
    this.enemyBarDOM.find('.bar_life').width(lifePercent + '%')
    this.enemyBarDOM.show()
  }

  hideEnemyBarLife () {
    this.enemyBarDOM.hide()
  }

  drawUserLife (lifeCurrent, initialLife) {

    let percent = Math.round( lifeCurrent * 100 / initialLife )
    this.playerBarDOM.find('.bar_life').css('bottom', '-' + (100 - percent) + '%')
    this.playerBarDOM.find('> span').text(`${lifeCurrent} / ${initialLife}`)
    if( !this.playerBarDOM.is(':visible') ) this.playerBarDOM.show()
  }

  deleteUserLife () {
    this.playerBarDOM.hide()
  }

  setAllyBox (player) {
    if (!this.alliesBoxDOM.find('.ally.ally_' + player.id).length) {
      this.alliesBoxDOM.prepend('<div class="ally ally_' + player.id + '"><div class="lifebox"><span class="lifecurrent"></span><span class="allyname">' + player.username + '</div></div>')
    }

    let currentLife = player.currentLifePercent()

    this.alliesBoxDOM.find('.ally.ally_' + player.id).find('.lifecurrent').width(currentLife + '%')
  }

  removeAllyBox (player) {
    let allyBox = this.alliesBoxDOM.find('.ally.ally_' + player.id)
    if (allyBox.length) {
      allyBox.remove()
    }
  }

  initPlayerStat (player) {
    let teamDOM = this.statisticDOM.find('[data-team=' + player.team + ']')
    if (!teamDOM.length) {
      this.statisticDOM.append(`<div data-team="${player.team}">
            <h2>Team ${player.team} <span>0</span></h2>
	            <table class="members">
	                <thead>
	                    <tr>
	                        <td>Name</td>
	                        <td>Kills</td>
	                        <td>Deaths</td>
	                        <td>Latency</td>
	                    </tr>
	                </thead>
	                <tbody>
	                </tbody>
	            </table>
	        </div>`)
    }

    this.statisticDOM.find('[data-team=' + player.team + '] tbody').append('<tr class="' + player.id + '"><td class="name">' + player.username + ' (' + player.character.name + ')</td><td class="kill">' + player.stats.kill + '</td><td class="death">' + player.stats.death + '</td><td class="latency">' + player.stats.latency + '</td></tr>')
  }

  removePlayerStat(){
    this.statisticDOM.html('');
  }
  setPlayerStat (player, type) {
    let playerStatDOM = this.statisticDOM.find('.' + player.id)

    if (!playerStatDOM.length) { this.initPlayerStat(player) } else {
      playerStatDOM.find('.' + type).text(player.stats[type])
    }
  }

  setScore (score) {
    this.statisticDOM.find('[data-team=' + score.team + '] h2 span').text(score.score)
  }

  initSpellItf (character) {
    for (let s of character.spells) {
      this.spellDOM.append(`
					<div data-name="${s.spell.name}" class="spell__item"></div>
				`)
    }
  }

  removeSpellItf(){
    this.spellDOM.html('');
  }

  setActiveSpell (spell) {
    this.spellDOM.find('.spell__item.active').removeClass('active')
    this.spellDOM.find('[data-name=' + spell.name + ']').addClass('active')
  }

  setRoundMessage(msg,time=5){
    this.roundInfoDOM.find('.round__info__text').html(msg);
    this.roundInfoDOM.find('.round__info__text').addClass('active');
    setTimeout( () => {
      this.roundInfoDOM.find('.round__info__text').removeClass('active');  
    },time*1000)
  }


  toggleRoundBg(){
    this.roundInfoDOM.find('.round__info__background').toggleClass('active');
  }

  initChat(socket){

    const { game } = this

    let inputMessage = jQuery('.in__game .message__input')
    let listMessage = jQuery('.in__game .message__list')
    let lastMessage = ''
    let addMessage = function (name, message) {
      let idMessage = Date.now()

      if (name) name += ' :'
      else name = ''

      listMessage.append('<div class="message-' + idMessage + '"><div class="inner__message"><span>' + name + '</span> ' + message + '</div></div>')
      setTimeout(function (id) {
        jQuery('div.message-' + id).remove()
      }, 10 * 1000, idMessage)
    }
    let closeInputMessage = function () {
      inputMessage.hide()
      inputMessage.find('>input').val('')
    }
    jQuery(document).on('keydown', function (e) {
      let code = e.which || e.keyCode

      switch (code) {
        case 13:

          if (!inputMessage.is(':visible')) {
            game.input.keyboard.enabled = false
            inputMessage.show()
            inputMessage.find('>input').focus()
          } else {
            let newMessage = inputMessage.find('>input').val().trim()
            game.input.keyboard.enabled = true

            if (newMessage) {
              socket.emit('newmessage', newMessage)
              addMessage(CurrentPlayer.username, newMessage)
              lastMessage = newMessage
            }

            closeInputMessage()
          }
          break

        case 27: // escape
          if (inputMessage.is(':visible')) { closeInputMessage() }
          break

        case Hotkeys.get('clear_message'): // n
          if (!inputMessage.is(':visible')) { listMessage.html('') }
          break

        case 38:
          let input = inputMessage.find('>input')

          if (input.length) {
            input.val(lastMessage)
            input.blur()
            input.focus()

            let msgLen = input.val().length * 2

            window.setTimeout(function () {
              input[0].setSelectionRange(msgLen, msgLen)
            }, 1)
          }

          break
      }
    })
  }

  toggleStatistic(){
    if (this.statisticDOM.is(':visible')) { this.statisticDOM.hide() } else { this.statisticDOM.show() }
  }

  initHotkeys(hks){
    Object.keys(hks).forEach( key => {
      let hk = hks[key]
      let value = _.findKey( Phaser.KeyCode , v => v === Hotkeys.get(key) )
      this.hotkeysDOM.append(`
          <div class="hotkey__label">${hk.label}</div>
          <div class="hotkey__value" data-key="${key}" data-value="${value}">${value}</div>
        `)
    })

    jQuery('.hotkey__value').on('click',function(){
      jQuery('.hotkey__value').removeClass('active')
      jQuery(this).toggleClass('active')
    })


    jQuery(document).on('keydown', function (e) {
      let activeHotkey = jQuery('.hotkey__value.active');

      if( !activeHotkey.length ) return

      e.preventDefault()

      let code = e.which || e.keyCode

      //72 => h
      //27 => esc
      // not allowed
      if( code === 72 
        || code === 27 ) return

      let value = _.findKey( Phaser.KeyCode , v => v === code );

      let existingHotkey = jQuery('.hotkey__value[data-value='+value+']')

      if( existingHotkey.length ) {
        existingHotkey.attr('data-value', '' ).text('')
        Hotkeys.remove( existingHotkey.attr('data-key') )
      }

      activeHotkey.text( value ).attr('data-value', value ).removeClass('active')
      Hotkeys.set( activeHotkey.attr('data-key'), code )




    })
  }

  toggleHotkeys(){
    this.hotkeysDOM.find('.hotkey__value').removeClass('active')
    this.hotkeysDOM.toggleClass('active')
  }

}

export default Interface
