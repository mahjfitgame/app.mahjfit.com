# Other steps
SIGNIN_FLOW=U+P+MFAD+VERIFY # possible values: U+P | U+MFAD+VERIFY | U+P+MFAD+VERIFY | U+MFAO+VERIFY | U+P+MFAO+VERIFY (username, password, MFA options or MFA default, verify)

# / change in page layout
file: src/app/shared/auth/signin/page/template.html
we need to change in existing
Our sign in process has multiple steps
total steps are  4
U+P+MFAD or MFAO+VERIFY
1st user enter the username, email pass
from s2nd step it can be any as per server side configuration so any step will be there
either 
password
select auth option from multi factor authetication list or it will be auto selected as per pre default
OTP to verify 
all done let user into account

all spets are know as below
signin step username (ss-u)
signin step password (ss-p)
signin step multi factor authentication options (ss-mfao)
signin step multi factor authentication default (ss-mfad) [there will not be the step but it will be directly move or ss-v]
signin step otp verify (ss-v)

i have completed design of ss-u 
where there is a page and form
page include form componenet
now remain steps needs to be in form comporneent 
file: src/app/shared/auth/signin/form/template.html

you need to change existing page componenet which has left side some display conatct and right side form
which is fine and requried for ss-u step but from next step 
there will a form on screen in center nothitng else

all of those forms will go in form componenet conditionaly
once user submit the each step server api call will be made and which is next step it will be decided by server and her eon client side that step form will be displaied.

so as per api response need to take decision. from api there will be filed like 
(signin step next)
ss_next: P | MFAO | VERIFY (if MFAD then server will take decision directly and point to load verfify step)
when all done there will be a jwt provided means redirect to my account or api will give you [ss_next].

so, now our design should align this work flow and it should be highely configurable
need to update 2 files
src/app/shared/auth/signin/form/component.ts
src/app/shared/auth/signin/form/style.scss

after user name step each screen will have form in center 2 part left and right rectangle
left side user in procegress info like email or mobile or user name and rgth side step to comlete like pass word or choose option or otp
kind of design layout.

make sure entire code stay clear and do not mess with each other
checl the exosting code base and structur, clasS name of element, sccs selector and all.
need to make sure everthing stay simple and effectiv and configurable.

you can defien required types in file
src/app/shared/auth/signin/type.ts

just for your iformation 
there is a service file 
src/app/shared/auth/signin/service.ts
which will mamages the API call.




# / issue in reponsive
file: src/app/shared/auth/signin/page/template.html
there is an issue when screen get resized. in mobile view in some view port it keep space on right instead it should progress so this looks not good at all. 

FOR YOU]
if you run the project then you need to check this url 
http://192.168.0.13:20154/signin
for sign in page

you can try in responsive and get the idea when it more rom tablat to mobile view..


# / Too much code for simple thing
What i want is in file
src/app/shared/auth/signin/form/component.ts
there is form config like
public config: SigninStepUsername = {
    appName: 'BFW',
  };
rename it to formConf and set 
formConf!: SigninStepUsername;
and in constructor or in ngOnInit
create full objec of formConf as default
and use same in .html.
No need to create method for each.
seems like over enginnering for simple settings.
later when setings come from api we will just replace whst ever is in api in default formConf
so in html it will refelcet dynamic values.

make this code simple and easy. its too much for simple configuration. only one config formConf and that do all.
this way all config will also stay at once place in one object, easy to sport, modify and understand.

# / help text is showing too down 
1]
file: src/app/shared/auth/signin/form/template.html
we have text box and hel ptext where it shows message and also error message 
it seems too down after text box. message like..
Enter your email, mobile number, or username.

message area should close to text box.

2]
 <mat-label> is not vertically in middle. ITs appearing little down words in text box. fix it.


FOR YOU]
app is running with diff ip and port you can check in angular.json
if you run the project then you need to check this url 
http://192.168.0.13:20154/signin
for sign in page

# / identifierLabel and placeholder are still not proper
1]
src/app/shared/auth/signin/form/template.html
still there is an isseu with proper alignment with 
identifierLabel, placeholder. need som epadding it smees not approprtiete.
identifierLabel shows bit down when user do not click atext box and when click it goes top whic is right but it shift too left ned some space like
-- identifierLabel -------
|                        |
--------------------------
at this memnt its like below
| identifierLabel --------
|                        |
--------------------------
whic is not proper
in addtion text box also requierd some padding or somehting because placeholder doesn't see in vertically center 
so at the end should look in center verticlaly both identifierLabel and placeholder

2]
<mat-hint> is too down after text box it hsould be close to it. 
not looking good.


FOR YOU]
if you run the project then you need to check this url 
http://192.168.0.13:20154/signin
for sign in page

# / Fix issue in signin form
File: src/app/shared/auth/signin/form/template.html
1]
identifier input type has issue with place holder which keep shwing not alighted wiht materia
also has issue with spacing inside. with first click unable to see the courser

2]
message at the bottom of text box like
Enter your email, mobile number, or username.
or any other eror message 
leave some space before 
basically 
mat-mdc-form-field-error-wrapper has some padding or margine make slook odd.
and ini addtion add some icons as per message type like i with color as per msessage type

3]
or continue with
if no option set then that scripon should not be displaied so like it should be conditional
currect condition only check the elements not the whole section so need some login to check if oauth length > 0  emans we have somehting 

4]
showFooterLinks
it shold be <a> tag not a button
inside showFooterLinks > footer has border top which looks not good remove it



# / Switch some functionality
module: src/app/shared/auth/signin
Before it was like
|- component.ts
|- service.ts
|- template.html
|- style.scss
|- route.ts
|- slug.ts

now i changed few things as below 
|- form
|-- component.ts
|-- template.html
|-- style.scss
|- page
|-- component.ts
|-- template.html
|-- style.scss
|- service.ts
|- route.ts
|- slug.ts

so basicaly make it more clear to redeign and modification as intension of this project is to aligh with any project requirement and them.
Login comes in every system so we have defined sigin page where signin page layout and its related things
and signin form where all form relaed info.

now, 
src/app/shared/auth/signin/page/component.ts
has some code which is related with old state and not is in 
src/app/shared/auth/signin/form/
so need to shift that code to src/app/shared/auth/signin/form/component.ts

do the change and finish the shifting of componnent
template and style files are already done just component.ts is remain so check the 
template.html and understand what to shift and what not.
