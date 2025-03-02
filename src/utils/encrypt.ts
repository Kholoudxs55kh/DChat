const HOME_URL = "http://localhost:8081";

export const encryptMessage = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${HOME_URL}/encrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    return data.encryptedRSA;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error;
  }
};

export const decryptMessage = async (
  encryptedMessage: string
): Promise<string> => {
  try {
    const response = await fetch(`${HOME_URL}/decrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encryptedMessage }),
    });

    const data = await response.json();
    return data.decryptedMessage;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
};
