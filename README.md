# planetside-bot

This is the backup of my bot for tracking characters in the game Planetside 2!

It connects with PS2's census and streaming APIs to get realtime statistics of players, and uses Discord's API to receive commands and relay information.
Static information is saved in cache.json to reduce API requests, and tracking.json saves the IDs of the characters currently being tracked by this bot.

Stat trackers like this are popular among PS2 players, and this is my attempt to create my own, which allows me to get a log of my session's performance or see how a friend is performing.

I have encountered issues when there is a high frequency of events, and the bot reaches the message rate limit set by Discord. I plan to work around this by only sending messages once every couple seconds, and grouping all events that would be sent into that single message.
