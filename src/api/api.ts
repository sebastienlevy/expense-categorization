export const getAllSheets = async (client: any) => {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${import.meta.env.VITE_GSHEETS_ID}?includeGridData=true`, {
      headers: {
        Authorization: `Bearer ${client.access_token}`
      }
    })

    const data = await response.json();
    if(data.error) {
      throw new Error(data.error.message)
    }
    return data;

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}

export const updateSheet = async ({client, sheetId, values}: {client: any, sheetId: string, values: Array<string[]>}) => {
  debugger;
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${import.meta.env.VITE_GSHEETS_ID}/values/'${sheetId}'!A2:B100?valueInputOption=RAW&includeValuesInResponse=true`, {
      method: 'PUT',
      body: JSON.stringify({
        values,
        "majorDimension": "ROWS"
      }),
      headers: {
        Authorization: `Bearer ${client.access_token}`
      }
    })

    const data = await response.json();
    if(data.error) {
      throw new Error(data.error.message)
    }
    return data;

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}