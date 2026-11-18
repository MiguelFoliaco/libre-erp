export const generateIdAlphaNum = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};


export const generateSKUId = (length: number, spliter: string, prefix: string) => `${prefix}_${generateIdAlphaNum(length).split('').join(spliter)}`