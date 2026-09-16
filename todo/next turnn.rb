next turnn
or
clame{
 target_sheet: [434,2]
 submission: {
  434: true
 }
}

Player Discard 
processDiscard() --> when request arrive all players are waiting
|
(other player will have waiting status..)
Waiting...
the player who discard will also have waiting status when request sent to server
|
request received om server in discard method
(still all players will have waiting status..)
|
in discard method this process will run
1. adjust tile rack for wall and player who discarded the tile
2. take the discarded tile and check againes all player tile rack and see if is there any match found for clame
3. if match found make entry in target_sheet
4. loop through all the target_sheet and find if there is any bot, in loop we will take decision for bot and and will also update submission key
|
server process finished 
5. send response to all players
still all player has waiting... statue
|
client received the response 
check if private or play has target_sheet.length > 0 and it contain self sheat id + submission do not contain self id
if sheat id found in   in submission not found then show clame window 
if sheat id found in target_sheetand but submission also has self sheat id means anwer is already submitted so just show waiting
|
if the user who submitted vot for clam and its last the server will get all vot and will finish the clame process

-----
We will have clame submit event in ws which collect came vot from player
like clameVot()
|
in thi smethod it will check target_sheet.length and submission.lenght
|  
match if target_sheet.length = submission.lenght (if match then process the claim action for valid player)
if count does not match then just keep updating the state and keep sending the response via ws




