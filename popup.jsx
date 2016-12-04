/* global chrome */
import React from 'react';
import ReactDOM from 'react-dom';

class Popup extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      address: [],
      transferProtocol: 'http://',
      startTime: '1am',
      endTime: '1pm',
      inputAddress: '',
      warning: false,
      newLabel: 'Activate!',
      alarmName: 'auto-url-pinger',
      inOutTime: ''
    };
    this.submitAddress = this.submitAddress.bind(this);
    this.toggleAlarm = this.toggleAlarm.bind(this);
  }

  componentDidMount(){
    this.setState({inOutTime: this.timeChecker()});
    chrome.storage.sync.get('pinger-addresses', data=>{
      let response = data['pinger-addresses'];
      if(response){
        if(response.length > 0){
          let address = response.concat(this.state.address);
          this.setState({address: address});
        }
      }
    });
    chrome.alarms.getAll(alarms=>{
      let has = alarms.some(a=>{
        return a.name === this.state.alarmName;
      });
      if(has){
        this.setState({newLabel: 'Cancel'});
      }
    });
    chrome.storage.sync.get('pinger-start-end-times', data=>{
      if(data['pinger-start-end-times']){
        let times = data['pinger-start-end-times'];
        let startOption = $('.start-time')[0][times[0] - 1];
        let endOption = $('.end-time')[0][times[1] - 1];
        $(startOption).attr('selected', true);
        $(endOption).attr('selected', true);
        setTimeout(()=>{
          this.setState({
            startTime: times[0] + 'am',
            endTime: times[1] + 'pm'
          });
        }, 1000);
      }
    });
  }

  submitAddress(e){
    e.preventDefault();
    if(!this.state.inputAddress){
      this.setState({warning: true});
    } else {
      let address = this.state.address.concat(
        [this.state.transferProtocol + this.state.inputAddress + '/']
      );
      chrome.storage.sync.set({'pinger-addresses': address});
      this.setState({
        address: address,
        inputAddress: '',
        warning: false
      });
    }
  }

  removeAddress(add, e){
    e.preventDefault();
    let idx = this.state.address.indexOf(add);
    let address = [].concat(this.state.address);
    address.splice(idx, 1);
    this.setState({
      address: address,
      warning: false
    });
    chrome.storage.sync.set({'pinger-addresses': address});
  }

  showAddressList(){
    if(!this.state.address.length){
      return(<div>No address saved</div>);
    } else {
      return (
        this.state.address.map((add, i)=>{
          return(
            <div id='single-list' key={`list-${i}`}>
              <li type='1' key={`address-${i}`} id='inner-list'>
                {add}
              </li>
              <div id='close-button'>
                <img src='../../../assets/icon/close.png'
                  onClick={(e)=>this.removeAddress(add, e)}
                  height='17'
                  width='17'/>
              </div>
            </div>
          );
        })
      );
    }
  }

  showAddressInput(){
    let http = 'http://', https = 'https://';
    return(
      <form onSubmit={this.submitAddress} autoComplete='off' id='add-address'>
        <div id="transfer-protocol">
          <select>
            onChange={this.update('transferProtocol')}>
            <option>{http}</option>
            <option>{https}</option>
          </select>
        </div>
        <input type='text'
               placeholder='address'
               value={this.state.inputAddress}
               onChange={this.update('inputAddress')}
               id='address-input'/>
        <div id='add-button'>
          <img src='../../../assets/icon/plus.png'
               onClick={this.submitAddress}
               width='15'
               height='15'/>
        </div>
      </form>
    );
  }

  showWarning(){
    if(this.state.warning){
      return(
        <div id='warning'>Please put in an address!</div>
      );
    }
  }

  toggleAlarm(){
    debugger;
    chrome.alarms.getAll(alarms=>{
      let hasAlarm = alarms.some(a=>{
        return a.name === this.state.alarmName;
      });
      if (hasAlarm) {
        this.setState({newLabel: 'Activate!'});
        chrome.alarms.clear(this.state.alarmName);
        $('#start').removeClass('green-background red-background').
        addClass('yellow-background');
      } else {
        this.setState({newLabel: 'Cancel'});
        chrome.alarms.create(
          this.state.alarmName,
          {delayInMinutes: 1, periodInMinutes: 19}
        );
        let start = parseInt(this.state.startTime.split('am').join(''));
        let end = parseInt(this.state.endTime.split('pm').join(''));
        chrome.storage.sync.set(
          {'pinger-start-end-times': [start, end]}
        );
      }
    });
  }

  timeChecker(){
    let currentHour = new Date().getHours();
    let startHour = parseInt(this.state.startTime.split('am').join(''));
    let endHour = parseInt(this.state.endTime.split('pm').join(''));
    if(currentHour >= startHour && currentHour < endHour){
      return 'inTime';
    } else {
      return 'outTime';
    }
  }

  showAlarm(){
    if(this.state.address.length > 0){
      return (
        <div id='start-div'>
          <span id='alarm-label' onClick={this.toggleAlarm}>
            {this.state.newLabel}
          </span>
          {this.showLoader()}
        </div>
      );
    }
  }

  showLoader(){
    let startDiv = $('#start');
    if(this.state.newLabel === 'Cancel'){
      if(this.state.inOutTime === 'inTime'){
        startDiv.removeClass('yellow-background').addClass('green-background');
        return(
          <div id='start-div'>
            <span id='pinging-text'>pinging...</span>
            <div className='loader'></div>
          </div>
        );
      } else {
        startDiv.removeClass('yellow-background').addClass('red-background');
        return(
          <div id='start-div'>
            <span id='pinging-text'>waiting...</span>
            <div className='loader2'></div>
          </div>
        );
      }
    }
  }

  update(field){
    return e => { this.setState({[field]: e.currentTarget.value }); };
  }

  render(){
    return(
      <div id='container'>
        <div id='address-list'>
            <ol>
              {this.showAddressList()}
            </ol>
        </div>
        <div id='data-input'>
          {this.showAddressInput()}
          {this.showWarning()}
          <div id='time-range'>
            <div id='time-child'>From</div>
            <select id="hours time-child"
              className='start-time'
              onChange={this.update('startTime')}>
              <option>1am</option>
              <option>2am</option>
              <option>3am</option>
              <option>4am</option>
              <option>5am</option>
              <option>6am</option>
              <option>7am</option>
              <option>8am</option>
              <option>9am</option>
              <option>10am</option>
              <option>11am</option>
            </select>
            <div id='time-child'>To</div>
            <select id="hours time-child"
              className='end-time'
              onChange={this.update('endTime')}>
              <option>1pm</option>
              <option>2pm</option>
              <option>3pm</option>
              <option>4pm</option>
              <option>5pm</option>
              <option>6pm</option>
              <option>7pm</option>
              <option>8pm</option>
              <option>9pm</option>
              <option>10pm</option>
              <option>11pm</option>
            </select>
          </div>
        </div>
        <div id='start' className='yellow-background'>
          {this.showAlarm()}
        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const root = document.getElementById('root');
  ReactDOM.render(<Popup />, root);
});
