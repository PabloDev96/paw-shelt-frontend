import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const COLORS = {
  background: 'var(--light)',
  text: 'var(--dark)',
  confirm: 'var(--medium)',
  cancel: 'var(--medium-light)',
  error: 'var(--error)',
  success: 'var(--medium-light)',
};

export const showSuccess = (title, text = '', timer = 2000) => {
  return MySwal.fire({
    icon: 'success',
    title,
    text,
    background: COLORS.background,
    color: COLORS.text,
    iconColor: COLORS.success,
    confirmButtonColor: COLORS.confirm,
    showConfirmButton: false,
    timer,
    customClass: {
      popup: 'swal-popup',
      title: 'swal-title',
    },
  });
};

export const showError = (title, text = '') => {
  return MySwal.fire({
    icon: 'error',
    title,
    text,
    background: COLORS.background,
    color: COLORS.text,
    iconColor: COLORS.error,
    confirmButtonColor: COLORS.error,
    customClass: {
      popup: 'swal-popup',
      title: 'swal-title',
    },
  });
};

export const showConfirm = (title, text = '') => {
  return MySwal.fire({
    icon: 'warning',
    title,
    text,
    background: COLORS.background,
    color: COLORS.text,
    iconColor: COLORS.confirm,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: COLORS.error,
    cancelButtonColor: COLORS.cancel,
    customClass: {
      popup: 'swal-popup',
      title: 'swal-title',
      confirmButton: 'swal-confirm-button',
      cancelButton: 'swal-cancel-button',
    },
  });
};
