// PresenterRTC extends BaseRTC by exposing the onaddstream
// event of each peer connection. This allows the presenter
// to detect when new audience streams are added
//
// Will probably also expose other events here that the 
// presenter will want to listen for -- e.g. onremovestream.
var RibbitPresenterRTC = function (user, options) {
  RibbitBaseRTC.call(this, user, options);
  this.onaddstream = options.onaddstream; //used in createConnectionTo
}

RibbitPresenterRTC.prototype = Object.create(RibbitBaseRTC.prototype);
RibbitPresenterRTC.prototype.constructor = RibbitPresenterRTC;


RibbitPresenterRTC.prototype.createConnectionTo = function (user) {
  var pc = RibbitBaseRTC.prototype.createConnectionTo.call(this, user);
  pc.onaddstream = this.onaddstream; //make sure each peer connection has our onstream handler
  return pc;
}
