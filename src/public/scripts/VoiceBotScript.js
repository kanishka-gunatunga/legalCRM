// Define global variables
let chatHistory = [];
let messageDiv;
let chatWithAgent = false;
let chatTimeoutId;
let endChatAlertShown = false;
let formattedTime = "";
let intervalId;
let agentJoined = false;
let chatStatus = "bot";
let clientDetailsSubmitStatus = false;

// show opening time function
function setFormattedOpenedTime() {
  const OpenedTime = new Date();
  let Opendhours = OpenedTime.getHours();
  const Openedminutes = OpenedTime.getMinutes().toString().padStart(2, "0");
  const Openedseconds = OpenedTime.getSeconds().toString().padStart(2, "0");
  const Openedampm = Opendhours >= 12 ? "PM" : "AM";
  Opendhours = Opendhours % 12;
  Opendhours = Opendhours ? Opendhours : 12;
  const formattedOpenedTime = `${Opendhours.toString().padStart(
    2,
    "0"
  )}:${Openedminutes} ${Openedampm}`;

  document.getElementById("OpenedTime1").textContent = formattedOpenedTime;
}

// set time - all the visible time manage
const currentTime = new Date();
let hours = currentTime.getHours();
const minutes = currentTime.getMinutes().toString().padStart(2, "0");
const seconds = currentTime.getSeconds().toString().padStart(2, "0");
const ampm = hours >= 12 ? "PM" : "AM";
hours = hours % 12;
hours = hours ? hours : 12;
formattedTime = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;

// Call function to set the time
setFormattedOpenedTime();

// Event listener - clear localStorage items on browser refresh
window.addEventListener("beforeunload", function (event) {
  localStorage.removeItem("selectedLanguage");
  localStorage.removeItem("chatId");
});

// Function - show typing animation
function showTypingAnimation() {
  const responseDiv = document.getElementById("response");
  const typingMessage = document.createElement("div");
  typingMessage.classList.add("bot-message");
  typingMessage.innerHTML = `
              <div class="typing-animation typingmsg-wrapper">
                  <i class="bi bi-three-dots loading typing-msg"></i>
              </div>
              `;
  responseDiv.appendChild(typingMessage);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

// Function - hide typing animation
function hideTypingAnimation() {
  const typingMessage = document.querySelector(".typing-animation");
  if (typingMessage) {
    typingMessage.remove();
  }
}

// Function - handle error messages
function handleErrorMessage(error) {
  const responseDiv = document.getElementById("response");
  let errorMessage =
    "<p class='error-message'>The allocated number of tokens are over, please ask the administrator to add more tokens to the system.</p>";
  if (
    error.message ===
    "The allocated number of tokens are over, please ask the administrator to add more tokens to the system."
  ) {
    errorMessage =
      "<p>The allocated number of tokens are over, please ask the administrator to add more tokens to the system.</p>";
  }
  responseDiv.innerHTML = errorMessage;
}

// Function - start chat timeout 150000 (if user didn't interact within 2.5 minutes )
function startChatTimeout() {
  chatTimeoutId = setTimeout(showEndChatAlert, 150000);
}

// Function - reset chat timeout
function resetChatTimeout() {
  clearTimeout(chatTimeoutId);
  startChatTimeout();
}

// Alert - handle chat end
function showEndChatAlert() {
  if (!endChatAlertShown) {
    endChatAlertShown = true;

    const responseDiv = document.getElementById("response");
    const alertDiv = document.createElement("div");
    alertDiv.classList.add(
      "alert",
      "alert-warning",
      "alert-dismissible",
      "fade",
      "show"
    );
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerHTML = `
                Parece que no has enviado ningún mensaje durante un tiempo. ¿Quieres finalizar el chat?
                <div class="d-flex flex-row">
                  <button type="button" class="btnYesToClose closeratingbot" onclick="handleEndChatBot()">Sí</button>
                  <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancelar</button>
                </div>
            `;
    responseDiv.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: "smooth" });
  }
}

// Alert - handle chat end for live agent
function showEndChatAlertAgent() {
  if (!endChatAlertShown) {
    endChatAlertShown = true;

    const responseDiv = document.getElementById("response");
    const alertDiv = document.createElement("div");
    alertDiv.classList.add(
      "alert",
      "alert-warning",
      "alert-dismissible",
      "fade",
      "show"
    );
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerHTML = `
                ¿Estás seguro de que deseas cerrar este chat? ¿Quieres finalizar el chat?
                <div class="d-flex flex-row">
                  <button type="button" class="btnYesToClose btn-end-chat closeRateAgent" onclick="handleEndChat()">Sí</button>
                  <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancelar</button>
                </div>
            `;
    responseDiv.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: "smooth" });
  }
}

// Alert - handle chat end for chat bot
function showEndChatAlertBot() {
  if (!endChatAlertShown) {
    endChatAlertShown = true;

    const responseDiv = document.getElementById("response");
    const alertDiv = document.createElement("div");
    alertDiv.classList.add(
      "alert",
      "alert-warning",
      "alert-dismissible",
      "fade",
      "show"
    );
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerHTML = `
                ¿Estás seguro de que deseas cerrar este chat? ¿Quieres finalizar el chat?
                <div class="d-flex flex-row">
                  <button type="button" class="btnYesToClose abc btn-end-chat" onclick="handleEndChatBot()" >Sí</button>
                  <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancelar</button>
                </div>
            `;
    responseDiv.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: "smooth" });
  }
}

// Function - start rating
function handleEndChatBot() {
  showAlertSuccess("Gracias por chatear con nosotras.");
}

// Function - handle ending the chat
function handleEndChat() {
  clearTimeout(chatTimeoutId);

  appendMessageToResponse(
    "bot",
    "Please rate your chat experience:",
    null,
    true
  );
}

// Function - append message to response div
function appendMessageToResponse(role, content, data, isRatingForm = false) {
  const responseDiv = document.getElementById("response");

  content = content.replace(/\*\*(.*?)\*\*/g, "$1");

  const messageDiv = createMessageDiv(isRatingForm ? "rate" : role, content);
  const image = createMessageImage(isRatingForm ? "rate" : role);

  if (isList(content)) {
    appendListContent(messageDiv, content);
  } else if (
    content.includes("Se seleccionará el agente de marketing.") || 
  content.includes("Le proporcionaremos la información solicitada en las próximas 24 horas. Mientras tanto, le rogamos que nos proporcione sus datos de contacto para que podamos contactarle si es necesario.")
  ) {
    appendLiveAgentContent(messageDiv, content, data);
  } else {
    appendPlainTextContent(messageDiv, content);
  }

  if (isRatingForm) {
    // appendRatingForm(messageDiv);
    const chatId = localStorage.getItem("chatId");
    appendRatingForm(messageDiv, chatId);
  }

  resetChatTimeout();

  messageDiv.prepend(image);
  responseDiv.appendChild(messageDiv);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

function createMessageDiv(role, content) {
  const messageDiv = document.createElement("div");

  // Add class based on the role
  if (role === "user") {
    messageDiv.classList.add("user-message");
  } else if (role === "bot") {
    messageDiv.classList.add("bot-message");
  } else if (role === "product") {
    messageDiv.classList.add("product-message");
  } else if (role === "quickQuestion") {
    messageDiv.classList.add("user-message");
  } else if (role === "quickAnswer") {
    messageDiv.classList.add("bot-message");
  } else if (role === "liveagent") {
    messageDiv.classList.add("bot-message");
  } else if (role === "rate") {
    messageDiv.classList.add("rate-message");
  }

  messageDiv.textContent = content;

  return messageDiv;
}

// Function - handle image based on role
function createMessageImage(role) {
  const image = document.createElement("img");
  image.classList.add("message-image");
  image.src = role === "user" ? "/user.webp" : "/agent.png";
  return image;
}

// Function - handle list view (chat bot)
function isList(content) {
  const listRegex = /^\d+\.\s.*$/gm;
  return listRegex.test(content);
}
function appendListContent(messageDiv, content) {
  const listItems = content
    .split("\n")
    .map((item) => `<li style="margin-bottom: 10px !important;">${item}</li>`)
    .join("");
  messageDiv.innerHTML = `<div class="messageWrapper">
      <span class="botname-message">${formattedTime}</span>
      <div>
        <ul style="list-style: none; padding: 0px !important">${listItems}</ul>
      </div>
    </div>`;
}






// ===============================================
// ================ lead submission to CRM =======================
// ===============================================
function appendLiveAgentContent(messageDiv, content, data) {
  const formattedTime = new Date().toLocaleTimeString();
  const formId = `form-${Math.random().toString(36).substr(2, 9)}`;
  
  messageDiv.innerHTML = `<div class="messageWrapper">
      <span class="botname-message">${formattedTime}</span>
      <div class="d-flex flex-column" id="${formId}">
        <input type="text" placeholder="Su nombre" id="title" class="mb-2 p-1 formLegalCRM">
        <input type="tel" placeholder="Número de teléfono" id="phone" class="mb-2 p-1 formLegalCRM">
        <input type="email" name="email" placeholder="Dirección de correo electrónico" id="email" class="mb-2 p-1 formLegalCRM">
        <input type="text" name="message" placeholder="Mensaje" id="message" class="mb-2 p-1 formLegalCRM">
        
        <div class="mb-2 px-0 d-flex flex-row align-items-start">
          <input type="checkbox" id="privacyPolicyCheckbox" style="margin-right: 10px; margin-top: 3px;">
          <label for="privacyPolicyCheckbox">
            He leído y acepto la Política de privacidad y los Términos y condiciones.
          </label>
        </div>
        
        <button id="LiveAgentButton" class="liveagentBtn" disabled>Entregar</button>
        <div>${content}</div>
      </div>
    </div>`;

  const liveAgentButton = messageDiv.querySelector("#LiveAgentButton");
  const privacyCheckbox = messageDiv.querySelector("#privacyPolicyCheckbox");

  privacyCheckbox.addEventListener("change", () => {
    liveAgentButton.disabled = !privacyCheckbox.checked;
  });

  liveAgentButton.addEventListener("click", () => {
    handleLiveAgentButtonClick(formId, data); 
  });
}

async function handleLiveAgentButtonClick(formId, data) {
  console.log("Form ID in handler:", formId);  
  
  const form = document.getElementById(formId);  
  if (!form) {
    console.error("Form not found with ID:", formId);
    return;
  }

  const title = form.querySelector("#title").value;
  const phone = form.querySelector("#phone").value;
  const email = form.querySelector("#email").value;
  const description = form.querySelector("#message").value;
  const leadValue = 0;

  const phonePattern = /^[0-9]{10}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!phonePattern.test(phone)) {
    showAlert("Por favor ingrese un número de teléfono válido (10 dígitos).");
    return;
  }
  if (!emailPattern.test(email)) {
    showAlert("Por favor ingrese una dirección de correo electrónico válida.");
    return;
  }

  const payload = {
    title: title,
    phone: phone,
    email: email,
    description: description,
    lead_value: leadValue,
  };
  console.log("Payload to be sent:", payload); 

  try {
    const response = await fetch("https://projects.genaitech.dev/laravel-crm/api/create-lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log("API response:", responseData);

    if (response.ok) {
      clientDetailsSubmitStatus = true
      showAlert("¡Prospecto creado exitosamente!");
      form.querySelector("#title").value = '';
      form.querySelector("#email").value = '';
      form.querySelector("#phone").value = '';
      form.querySelector("#message").value = '';
    } else {
      showAlert("Error al crear cliente potencial: " + responseData.message);
    }
  } catch (error) {
    console.error("Error sending lead data:", error);
    showAlert("Ocurrió un error. Inténtalo de nuevo más tarde.");
  }
}

{/* <label for="privacyPolicyCheckbox">
            He leído y acepto la 
            <a href="https://example.com/privacy-policy" target="_blank">Política de Privacidad</a> y los 
            <a href="https://example.com/terms-conditions" target="_blank">Términos y Condiciones</a>.
          </label> */}


          

// ===============================================
// ================ chat close handle =======================
// ===============================================
async function chatCloseByUser() {
  if (agentJoined === true) {
    const chatId = localStorage.getItem("chatId");
    const response = await fetch("/close-live-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId: chatId }),
    });

    const dataChatClose = await response.json();
    console.log("Data Chat Close --: ", dataChatClose);
    if (dataChatClose.status === "success") {
      showEndChatAlertAgent();
    }
  } else {
    console.log("Chat bot doesn't have rating...");
    showEndChatAlertBot();
  }
}

function appendPlainTextContent(messageDiv, content) {
  messageDiv.innerHTML = `<div class="messageWrapper">
                              <span class="botname-message">${formattedTime}</span>
                              <div>
                              <p class="mb-0">${content}</p>
                              </div>
                          </div>`;
}




// ===============================================
// ================ alert apend to chat =======================
// ===============================================
function showAlert(message) {
  const responseDiv = document.getElementById("response");
  const alertDiv = document.createElement("div");
  alertDiv.classList.add(
    "alert",
    "alert-warning",
    "alert-dismissible",
    "fade",
    "show",
    "me-2"
  );
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
  responseDiv.appendChild(alertDiv);
  alertDiv.scrollIntoView({ behavior: "smooth" });
}






// ===============================================
// ================ success alert append to chat =======================
// ===============================================
function showAlertSuccess(message) {
  const responseDiv = document.getElementById("response");
  const alertDiv = document.createElement("div");
  alertDiv.classList.add(
    "alert",
    "alert-success",
    "alert-dismissible",
    "fade",
    "show",
    "me-2"
  );
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
  responseDiv.appendChild(alertDiv);
  alertDiv.scrollIntoView({ behavior: "smooth" });
}






// ===============================================
// ================ language change message append to chat =======================
// ===============================================
function appendLanguageMessage(content) {
  const responseDiv = document.getElementById("response");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("bot-message");

  const image = document.createElement("img");
  image.classList.add("message-image");
  image.src = "/agent.png";

  messageDiv.innerHTML = `<div class="messageWrapper">
      <span class="botname-message">${formattedTime}</span>
      <div>
        <p class="mb-0">${content}</p>
      </div>
    </div>`;
  messageDiv.prepend(image);

  responseDiv.appendChild(messageDiv);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}




// ===============================================
// ================ chat  =======================
// ===============================================
document
  .getElementById("questionForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const questionInput = document.getElementById("question");
    const question = questionInput.value;

    const selectedLanguageLocal = localStorage.getItem("selectedLanguage");
    chatHistory.push({ role: "user", content: question });

    appendMessageToResponse("user", question);

    console.log("selected Language:", selectedLanguageLocal);

    let chatId = localStorage.getItem("chatId");
    const requestBody = {
      chatId: chatId,
      messages: chatHistory,
      language: selectedLanguageLocal || "English",
      clientDetailsSubmitStatus : clientDetailsSubmitStatus
    };

    if (chatWithAgent === false) {
      const submitButton = document.querySelector(".chat-submit-button");
      submitButton.innerHTML = '<i class="bi bi-three-dots loading"></i>';
      submitButton.disabled = true;

      document.getElementById("startRecording").style.display = "none";
      document.getElementById("questionForm").style.width = "100%";

      try {
        questionInput.value = "";
        const response = await fetch("/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        chatHistory = data.chatHistory || [];

        if (!localStorage.getItem("chatId")) {
          localStorage.setItem("chatId", data.chatId);
          console.log("id: ", data.chatId);
        }
        if (data.answer !== null) {
          appendMessageToResponse("bot", data.answer, data);
        }

        document.getElementById("startRecording").style.display = "block";
        document.getElementById("questionForm").style.width = "100%";
      } catch (error) {
        console.error("Error submitting question:", error);
        handleErrorMessage(error);
      } finally {
        questionInput.disabled = false;
        submitButton.innerHTML = '<i class="bi bi-send-fill"></i>';
        submitButton.disabled = false;
      }
    } else {
      const responseLiveAgent = await fetch("/live-chat-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBodyAgent),
      });

      const liveAgentData = await responseLiveAgent.json();
      chatHistory = liveAgentData.chatHistory || [];
    }
  });





// ===============================================
// ================ language event listners =======================
// ===============================================
document
  .getElementById("changeToEnglishButton")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "none";
    document.getElementById("box2").style.display = "none";
    localStorage.setItem("selectedLanguage", "English");
    appendLanguageMessage("Please ask your question in English.");
  });

document
  .getElementById("changeToSpanishButton")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "none";
    document.getElementById("box2").style.display = "none";
    localStorage.setItem("selectedLanguage", "Sinhala");
    appendLanguageMessage("කරුණාකර ඔබේ ප්‍රශ්නය සිංහලෙන් අසන්න.");
  });







// ===============================================
// ================ rating =======================
// ===============================================

function appendRatingForm(messageDiv) {
  const ratingFormHTML = `
          <div class="star-rating-form d-flex flex-column px-2 py-3 mt-3" style="margin-bottom: 10px;">
            <label for="rating">Califica tu experiencia:</label>
            <div class="rating-icons d-flex flex-row" style="border: none !important;">
              <i class="bi bi-star rating-icon"></i>
              <i class="bi bi-star rating-icon"></i>
              <i class="bi bi-star rating-icon"></i>
              <i class="bi bi-star rating-icon"></i>
              <i class="bi bi-star rating-icon"></i>
            </div>
            <input type="hidden" id="rating" name="rating" value="0">
            <textarea type="text" id="feedbackMessage" name="feedbackMessage" class="feedbackMessage mb-2"></textarea>
            <button id="submitRatingButton" class="btnRatingView" onclick="handleRatingSubmission()">Entregar</button>
          </div>
        `;

  messageDiv.innerHTML = `<div class="messageWrapper">
        <span class="botname-message">${formattedTime}</span>
        <div class="ratingFormTest">
          <p class="mb-0">Por favor califica tu experiencia en el chat:</p>
        </div>
        ${ratingFormHTML}
      </div>`;

  // messageDiv.innerHTML += ratingFormHTML;

  addRatingIconEventListeners(messageDiv);
}

function addRatingIconEventListeners(messageDiv) {
  const ratingIcons = messageDiv.querySelectorAll(".rating-icon");
  ratingIcons.forEach((icon, index) => {
    icon.addEventListener("click", handleRatingIconClick(messageDiv, index));
  });
}

function handleRatingIconClick(messageDiv, index) {
  return function () {
    const ratingInput = messageDiv.querySelector("#rating");
    ratingInput.value = index + 1;
    const ratingIcons = messageDiv.querySelectorAll(".rating-icon");
    ratingIcons.forEach((star, i) => {
      star.classList.toggle("bi-star-fill", i <= index);
    });
  };
}

async function handleRatingSubmission() {
  const ratingInput = document.getElementById("rating");
  const rating = ratingInput.value;
  const feedbackMessageInput = document.getElementById("feedbackMessage");
  const feedbackMessage = feedbackMessageInput.value;
  const chatId = localStorage.getItem("chatId");

  try {
    const response = await fetch("/save-rating", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ratingValue: rating,
        feedbackMessage: feedbackMessage,
        chatId: chatId,
      }),
    });

    if (response.ok) {
      const responseDiv = document.getElementById("response");
      const thankYouDiv = document.createElement("div");
      thankYouDiv.classList.add(
        "alert",
        "alert-success",
        "alert-dismissible",
        "fade",
        "show"
      );
      thankYouDiv.setAttribute("role", "alert");
      thankYouDiv.textContent = "Thank you for your feedback!";
      responseDiv.appendChild(thankYouDiv);
      thankYouDiv.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
  }
}

function addRatingIconEventListeners(messageDiv) {
  const ratingIcons = messageDiv.querySelectorAll(".rating-icon");
  ratingIcons.forEach((icon, index) => {
    icon.addEventListener("click", () => {
      const ratingInput = document.getElementById("rating");
      ratingInput.value = index + 1;

      ratingIcons.forEach((star, i) => {
        if (i <= index) {
          star.classList.add("bi-star-fill");
          star.classList.remove("bi-star");
        } else {
          star.classList.remove("bi-star-fill");
          star.classList.add("bi-star");
        }
      });
    });
  });
}

addRatingIconEventListeners(messageDiv);
