export {};

declare global {
    interface Window {
        google: typeof google; // permet d'indiquer que window a une propriété google, GIS a injecté une propriété google qui est donc un objet global. google est du meme type que ce qui a été écrit en dessous
        // 
    }

    // Il s'agit d'une interface, en réalité : l'objet google.accounts.id.CredentialResponse n'existe pas. On définit juste la forme d'un objet dans le namespace
    namespace google.accounts.id {
            interface CredentialResponse {
            credential: string;
            select_by: string;
        }
    }

    // Il s'agits de types, l'objet google.accounts.id existe, on peut utiliser l'interface CredentialResponse en tant que parametre de callback
    namespace google {
        const accounts: {
            id: {

                initialize: (config: {
                    client_id: string;
                    callback: (response: google.accounts.id.CredentialResponse) => void;
                }) => void;

                renderButton: (parent: HTMLElement, options: Record<string, any>) => void;
                prompt: () => void;
            };
        };
    }
}