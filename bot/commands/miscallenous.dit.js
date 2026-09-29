new command ping, pong
  reply "Pong!"
  add reaction "👋"

new command embedtest, embed
  reply
    new Embed
      set title "Test title"
      set description "This is a test embed. $latency"
      set footer "Hey!"
      set timestamp //<-- comments are fully supported!

new command inlinefunctions,abc
  reply "This is an inline function command and my latency is $roundUp($latency) ms."


new command echo
    if "$length($message)" < "1"
        reply "Provide something to be echoed!"
    else
        reply "$message"

new command choice
  if "$message(1)" is "embed"
    reply
      new Embed
        set title "You chose $message(1)"
  else if "$message(1)" isnt "embed" and "$message(1)" is "message"
    reply "you chose $message(1)"
  else
    reply "please choose either embed or message!"

new command isstring
    if "$length($message)" < "1"
        reply "Provide something to be tested!"
    else
        reply "$isString($message)"

new command id
    if "$length($mention(1))" < "1" and "$length($message(1))" < "1"
        reply "$id"
    else if "$length($message(1))" > "1" and "$length($mention(1))" < "1"
        reply "$id($message(1))"
    else
        reply "$mention(1)"

new slashcommand test 
    reply ephemeral
        new Embed
            set title "hi"