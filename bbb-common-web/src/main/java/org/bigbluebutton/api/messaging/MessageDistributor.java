package org.bigbluebutton.api.messaging;

import org.bigbluebutton.api.messaging.messages.IMessage;

import java.util.Set;

public class MessageDistributor {
  private ReceivedMessageHandler handler;
  private Set<MessageListener> listeners;

  public void setMessageListeners(Set<MessageListener> listeners) {
    this.listeners = listeners;
  }

  public void setMessageHandler(ReceivedMessageHandler handler) {
    this.handler = handler;
    if (handler != null) {
      handler.setMessageDistributor(this);
    }
  }

  public void notifyListeners(IMessage message) {
    for (MessageListener listener : listeners) {
      listener.handle(message);
    }
  }
}
