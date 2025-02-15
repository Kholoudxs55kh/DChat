const HOME_URL = 'http://localhost:3000';

export const encryptMessgae = async (message: string) => {
  try {
    console.log('Encrypting message:', message);
    const res = await fetch(HOME_URL + '/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.encryptedRSA;
    }
  } catch (error) {
    console.error(error);
  }
};
