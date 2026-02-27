const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const appContainer = document.getElementById('app');
const redirectingContainer = document.getElementById('redirecting');
const notFoundContainer = document.getElementById('not-found');
const shortenForm = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const resultContainer = document.getElementById('result-container');
const shortUrlText = document.getElementById('short-url');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');
const submitBtn = shortenForm.querySelector('.btn');

let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error(error);
}

const urlParams = new URLSearchParams(window.location.search);
const shortCode = urlParams.get('c');

if (shortCode) {
    handleRedirect(shortCode);
} else {
    appContainer.style.display = 'flex';
}

async function handleRedirect(code) {
    redirectingContainer.classList.remove('hidden');

    if (!supabase) {
        alert('Check Vercel Environment Variables');
        redirectingContainer.classList.add('hidden');
        appContainer.style.display = 'flex';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('urls')
            .select('original_url')
            .eq('short_code', code)
            .single();

        if (error || !data) {
            redirectingContainer.classList.add('hidden');
            notFoundContainer.classList.remove('hidden');
        } else {
            window.location.replace(data.original_url);
        }
    } catch {
        redirectingContainer.classList.add('hidden');
        notFoundContainer.classList.remove('hidden');
    }
}

function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function formatUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
        return 'http://' + url;
    }
    return url;
}

shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabase) {
        alert('Check Vercel Environment Variables');
        return;
    }

    const originalUrl = formatUrl(urlInput.value.trim());
    if (!originalUrl) return;

    submitBtn.textContent = '...';
    submitBtn.disabled = true;

    try {
        const { data: existingUrl } = await supabase
            .from('urls')
            .select('short_code')
            .eq('original_url', originalUrl)
            .maybeSingle();

        if (existingUrl) {
            const baseUrl = window.location.origin + window.location.pathname;
            const fullShortUrl = `${baseUrl}?c=${existingUrl.short_code}`;

            shortUrlText.textContent = fullShortUrl;
            shortUrlText.href = fullShortUrl;
            resultContainer.classList.remove('hidden');

            urlInput.value = '';
            submitBtn.textContent = 'Submit';
            submitBtn.disabled = false;
            return;
        }

        let code = generateShortCode();
        let isUnique = false;

        for (let i = 0; i < 3; i++) {
            const { data } = await supabase.from('urls').select('id').eq('short_code', code).maybeSingle();
            if (!data) {
                isUnique = true;
                break;
            }
            code = generateShortCode();
        }

        if (!isUnique) {
            throw new Error('Error limit');
        }

        const { error } = await supabase
            .from('urls')
            .insert([{ short_code: code, original_url: originalUrl }]);

        if (error) {
            alert('Error');
        } else {
            const baseUrl = window.location.origin + window.location.pathname;
            const fullShortUrl = `${baseUrl}?c=${code}`;

            shortUrlText.textContent = fullShortUrl;
            shortUrlText.href = fullShortUrl;
            resultContainer.classList.remove('hidden');

            urlInput.value = '';
        }
    } catch {
        alert('Error');
    } finally {
        submitBtn.textContent = 'Submit';
        submitBtn.disabled = false;
    }
});

copyBtn.addEventListener('click', async () => {
    const textToCopy = shortUrlText.textContent;
    try {
        await navigator.clipboard.writeText(textToCopy);
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    } catch {
        const tempInput = document.createElement("input");
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);

        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }
});
