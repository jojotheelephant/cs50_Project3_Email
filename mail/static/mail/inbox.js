// initialize variables
const inbox = document.getElementById("inbox");
const sent = document.querySelector("#sent");
const archived = document.querySelector("#archived");
const all = document.querySelector("#all");
const compose = document.querySelector("#compose");
const emails_view = document.querySelector("#emails-view");
const email_view = document.querySelector("#email-view");
// used in compose()
const compose_view = document.querySelector("#compose-view");
const compose_recipients = document.querySelector("#compose-recipients");
const compose_subject = document.querySelector("#compose-subject");
const compose_body = document.querySelector("#compose-body");
const send = document.querySelector("#compose-form");
// used in getEmail()
const subjectContent = document.getElementById("email-subject");
const timestampContent = document.getElementById("timestamp");
const senderTitle = document.getElementById("sender-title");
const recipientsTitle = document.getElementById("recipients-title");
const emailBody = document.getElementById("email-body");
const actionButtons = document.getElementById("action-button");

document.addEventListener("DOMContentLoaded", function () {
    // Use buttons to toggle between views
    inbox.addEventListener("click", () => load_mailbox("inbox"));
    sent.addEventListener("click", () => load_mailbox("sent"));
    archived.addEventListener("click", () => load_mailbox("archive"));
    all.addEventListener("click", () => load_mailbox("all"));
    compose.addEventListener("click", compose_email);
    // By default, load the inbox
    load_mailbox("inbox");
});

function compose_email() {
    // Show compose view and hide other views
    emails_view.style.display = "none";
    email_view.style.display = "none";
    compose_view.style.display = "block";
    // Clear out composition fields
    compose_recipients.value = "";
    compose_subject.value = "";
    compose_body.value = "";
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    emails_view.style.display = "block";
    email_view.style.display = "none";
    compose_view.style.display = "none";
    // Show the mailbox name
    emails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    getMailbox(mailbox);
}

// sends requests to database for email in corresponding mailbox using Async Await. Trigger call to format email
// object keys: archived(bool), body, id, read(bool), recipients(array), sender, subject, timestamp
const getMailbox = async (mailbox) => {
    try {
        const response = await fetch(`/emails/${mailbox}`);
        const data = await response.json();
        console.log(data);
        formatMailBox(data, mailbox);
    } catch (err) {
        console.error(err);
    }
};

// formats the emails list to page in organized layout. white = unread, gray = read.
const formatMailBox = (emails, mailbox) => {
    // checks if there are emails. display no messages message if there are no new emails
    if (emails.length < 1) {
        const message = document.createElement("h4");
        message.innerHTML = "You have no messages";
        message.className = "alert alert-info";
        document.getElementById("emails-view").append(message);
        // map through email and format email page
    } else {
        const listGroup = document.createElement("div");
        listGroup.className = "list-group";
        listGroup.id = "listgroup";
        document.getElementById("emails-view").append(listGroup);
        emails.map((email) => {
            // create element 'a' with link to email as listItem
            const listItem = document.createElement("a");
            // check if email is inbox view AND has not been read, change bg to white, else gray
            if (email.read === false && mailbox === "inbox") {
                listItem.className = "list-group-item list-group-item-action";
            } else {
                listItem.className = "list-group-item list-group-item-action list-group-item-secondary";
            }
            // add EventListener to redirect to getMail()
            listItem.addEventListener("click", () => {
                getEmail(email, mailbox);
            });
            document.getElementById("listgroup").append(listItem);
            // create element 'div' to add email.sender and date/time sent
            const titleDiv = document.createElement("div");
            titleDiv.className = "d-flex w-100 justify-content-between";
            // create sender 'h5'
            const sender = document.createElement("h5");
            sender.className = "mb-1";
            sender.innerHTML = `>> ${email.sender}`;
            // create date 'small'
            const date = document.createElement("small");
            date.innerHTML = `${email.timestamp}`;
            // create subject 'p'
            const subject = document.createElement("p");
            subject.innerHTML = `Subject: ${email.subject}`;
            // append elements
            listItem.append(titleDiv);
            titleDiv.append(sender);
            titleDiv.append(date);
            listItem.append(subject);
        });
    }
};

// sends email to server using async await.
const sendEmail = async () => {
    recipients = compose_recipients.value;
    subject = compose_subject.value;
    body = compose_body.value;
    // POST request config
    const config = {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
        }),
    };
    // send fetch with config request using async await inside try catch
    try {
        const response = await fetch("/emails", config);
        const data = await response.json();
        if (data.message) {
            console.log(data.message);
            load_mailbox("sent");
        } else if (data.error) {
            console.log(data.error);
            const errorMessage = document.createElement("h4");
            errorMessage.innerHTML = data.error;
            errorMessage.className = "alert alert-danger";
            compose_view.insertBefore(errorMessage, send);
        }
    } catch (err) {
        console.error(err);
    }
    // do not refresh page
    return false;
};

// get individual email from clicking on mail in inbox
const getEmail = async (email, mailbox) => {
    // Show compose view and hide other views
    emails_view.style.display = "none";
    compose_view.style.display = "none";
    email_view.style.display = "block";
    // delete buttons. Will create new buttons below. This is to prevent issue with having multiple eventlisteners on an element.
    while (actionButtons.hasChildNodes()) {
        actionButtons.removeChild(actionButtons.firstChild);
    }
    // Request email from server
    try {
        // fetch request
        const response = await fetch(`emails/${email.id}`);
        const emailData = await response.json();
        // destructure all variables inside email object
        const { id, subject, archived, body, read, recipients, sender, timestamp } = emailData;
        // mark email read to true
        await fetch(`emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
                read: true,
            }),
        });
        // --- populate HTML values ---
        // fill innerTexts and innerHTMLs
        subjectContent.innerText = subject;
        timestampContent.innerText = timestamp;
        senderTitle.innerHTML = `<strong>${sender}</strong>`;
        recipientsTitle.innerText = recipients.join(", ");
        emailBody.innerText = body;
        // add buttons with event listeners.
        // reply button
        const replyButton = document.createElement("button");
        replyButton.className = "btn btn-primary";
        replyButton.id = "reply-button";
        replyButton.innerText = "Reply";
        replyButton.addEventListener("click", function () {
            replyEmail(emailData);
        });
        // archive button
        const archiveButton = document.createElement("button");
        archiveButton.className = "btn btn-primary";
        archiveButton.id = "archive-button";
        archiveButton.style = "margin-left: 5px";
        archived === true ? (archiveButton.innerText = "Unarchive") : (archiveButton.innerText = "Archive");
        archiveButton.addEventListener("click", function () {
            archiveEmail(emailData);
        });
        if (mailbox === "sent") {
            actionButtons.append(replyButton);
        } else {
            actionButtons.append(replyButton);
            actionButtons.append(archiveButton);
        }
        // if fetch request fail
    } catch (err) {
        console.error(err);
    }
};

// reply to email
const replyEmail = (email) => {
    compose_email();
    // fill recipients.value with sender's information
    compose_recipients.value = email.sender;
    // checks if current subject begins with 'Re: '. if not, add it, else, do nothing.
    const replyStringStarter = `Re: ${email.sender}`;
    email.subject.substring(0, 3) === "Re: " ? replyStringStarter : email.subject;
    compose_subject.value = replyStringStarter;
    // fill composebody value with original email value.
    compose_body.value = `\n\n---------------\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
};

// archive email
const archiveEmail = async (email) => {
    // determine if need to archive or unarchive
    isCurrentlyArchived = "";
    email.archived === true ? (isCurrentlyArchived = false) : (isCurrentlyArchived = true);
    const config = {
        method: "PUT",
        body: JSON.stringify({
            archived: isCurrentlyArchived,
        }),
    };
    // PUT request to server. then load inbox page
    await fetch(`emails/${email.id}`, config).then(console.log(`${email.id} has been archived`));
    load_mailbox("inbox");
};
