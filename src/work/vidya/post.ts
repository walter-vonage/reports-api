import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { VidyaConfig } from './config';

export async function uploadSource(csvPath: string, clientId: string, accountId: string, sourceName: string) {
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    
    const response = await axios.post(
        VidyaConfig.SERVER + `/v1/source`,  // Replace with actual base URL
        {
            name: sourceName,
            source_type: "csv",
        },
        {
            headers: {
                ...form.getHeaders(),
                'x-client-id': clientId,
                'x-account-id': accountId
            }
        }
    );
    
    const sourceId = response.data.id;

    // Now upload the file to this source
    await axios.post(
        `https://vidya.internal.api/v1/source/${sourceId}/add_file`,
        form,
        {
            headers: {
                ...form.getHeaders(),
                'x-client-id': clientId,
                'x-account-id': accountId
            }
        }
    );

    return sourceId;
}
