package org.bigbluebutton.voiceconf.messaging;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;

import org.red5.logging.Red5LoggerFactory;
import org.slf4j.Logger;

public class ReceivedMessageHandler {
	private static Logger log = Red5LoggerFactory.getLogger(ReceivedMessageHandler.class, "bigbluebutton");
	
	private BlockingQueue<ReceivedMessage> receivedMessages = new LinkedBlockingQueue<ReceivedMessage>();
	
	private volatile boolean processMessage = false;
	
	private final Executor msgProcessorExec = Executors.newSingleThreadExecutor();
	
	
	private MessageDistributor handler;
	
	public void stop() {
		processMessage = false;
	}
	
	public void start() {	
		log.info("Ready to handle messages from Redis pubsub!");

		try {
			processMessage = true;
			
			Runnable messageProcessor = new Runnable() {
			    public void run() {
			    	while (processMessage) {
			    		try {
							ReceivedMessage msg = receivedMessages.take();
							processMessage(msg);
						} catch (InterruptedException e) {
							log.warn("Error while taking received message from queue.");
						}   			    		
			    	}
			    }
			};
			msgProcessorExec.execute(messageProcessor);
		} catch (Exception e) {
			log.error("Error subscribing to channels: " + e.getMessage());
		}			
	}
	
	private void processMessage(ReceivedMessage msg) {
		if (handler != null) {
			log.debug("Let's process this message: " + msg.getMessage());

			handler.notifyListeners(msg.getPattern(), msg.getChannel(), msg.getMessage());
		} else {
			log.warn("No listeners interested in messages from Redis!");
		}
	}
	
	public void handleMessage(String pattern, String channel, String message) {
		ReceivedMessage rm = new ReceivedMessage(pattern, channel, message);
		receivedMessages.add(rm);
	}
	
	public void setMessageDistributor(MessageDistributor h) {
		this.handler = h;
	}
}
