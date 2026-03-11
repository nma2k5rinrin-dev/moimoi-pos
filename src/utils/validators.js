export function validatePassword(password) {
    if (!password) return 'Mật khẩu không được để trống';
    if (password.length < 8 || password.length > 20) {
        return 'Mật khẩu phải từ 8 đến 20 ký tự';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Mật khẩu phải chứa ít nhất 1 chữ viết hoa';
    }
    if (!/[a-z]/.test(password)) {
        return 'Mật khẩu phải chứa ít nhất 1 chữ viết thường';
    }
    if (!/[0-9]/.test(password)) {
        return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    }
    if (!/[!@#$^*]/.test(password)) {
        return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$^*)';
    }
    return null;
}
