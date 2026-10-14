document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app-container');
  const qrForm = document.getElementById('qr-form');
  const urlInput = document.getElementById('url-input');
  const clearBtn = document.getElementById('clear-btn');
  const qrcodeBox = document.getElementById('qrcode-box');
  const qrCard = document.getElementById('qr-card');
  const qrStage = document.getElementById('qr-stage');
  const toast = document.getElementById('toast-notification');

  let qrcodeInstance = null;
  let currentTargetUrl = '';
  let toastTimeout = null;

  // Clear 버튼 표시/숨김 제어
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
    }
  });

  // Clear 버튼 클릭 시 입력값 초기화
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.classList.remove('visible');
    urlInput.focus();
  });

  // URL 정규화 함수 (스캔 시 브라우저가 바로 열리도록 http(s) 없으면 기본 추가)
  function normalizeUrl(input) {
    let raw = input.trim();
    if (!raw) return '';
    // 이미 프로토콜(http, https, ftp 등)이 있는 경우 그대로 반환
    if (/^[a-zA-Z]+:\/\//i.test(raw)) {
      return raw;
    }
    // 도메인 또는 일반 텍스트에 https:// 붙여주기
    return 'https://' + raw;
  }

  // QR 코드 생성 함수
  function generateQRCode(rawText) {
    const finalUrl = normalizeUrl(rawText);
    if (!finalUrl) return;

    currentTargetUrl = finalUrl;

    // 기존 QR 내용 비우기
    qrcodeBox.innerHTML = '';

    // QRCode 인스턴스 생성
    qrcodeInstance = new QRCode(qrcodeBox, {
      text: finalUrl,
      width: 240,
      height: 240,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    // 뷰포트 상태를 QR 활성화 모드로 전환:
    // URL 입력창이 화면 하단으로 부드럽게 이동하고 중앙에 QR코드가 나타남
    if (!appContainer.classList.contains('has-qr')) {
      appContainer.classList.add('has-qr');
      qrStage.setAttribute('aria-hidden', 'false');
    }

    // 입력 필드에 보정된 URL 반영 (원하는 경우)
    if (!urlInput.value.startsWith('http://') && !urlInput.value.startsWith('https://')) {
      urlInput.value = finalUrl;
      clearBtn.classList.add('visible');
    }
  }

  // 폼 제출 이벤트 핸들러
  qrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputVal = urlInput.value.trim();
    if (!inputVal) {
      urlInput.focus();
      return;
    }
    generateQRCode(inputVal);
  });

  // QR 코드 클릭 시 JPG 다운로드 핸들러
  qrCard.addEventListener('click', () => {
    downloadQRAsJPG();
  });

  // QR 코드를 고화질 JPG 파일로 변환하여 다운로드
  function downloadQRAsJPG() {
    // QRCode.js는 브라우저 지원에 따라 캔버스 또는 이미지를 생성함
    const canvas = qrcodeBox.querySelector('canvas');
    const img = qrcodeBox.querySelector('img');

    if (!canvas && !img) {
      alert('생성된 QR 코드가 없습니다. URL을 먼저 입력해 주세요.');
      return;
    }

    // 고해상도 오프스크린 캔버스 준비 (여백 포함 400x400)
    const exportCanvas = document.createElement('canvas');
    const exportSize = 400;
    const padding = 36;
    const qrDrawSize = exportSize - padding * 2;

    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    // 1. JPG는 투명도를 지원하지 않으므로 순백색 배경(#ffffff)을 칠해줌
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportSize, exportSize);

    // 2. 캔버스나 이미지 소스를 그리는 공통 함수
    const saveCanvasToFile = (sourceElement) => {
      ctx.drawImage(sourceElement, padding, padding, qrDrawSize, qrDrawSize);

      // JPG Data URL 추출 (고품질 0.95)
      const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

      // 가상 <a> 태그를 만들어 다운로드 트리거
      const link = document.createElement('a');
      const filenameDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `qrcode_${filenameDate}_${Math.floor(Math.random() * 1000)}.jpg`;
      link.href = jpgDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 클릭 시 일시적인 바운스 효과
      qrCard.style.transform = 'scale(0.96)';
      setTimeout(() => {
        qrCard.style.transform = '';
      }, 150);

      // 다운로드 완료 토스트 표시
      showToast();
    };

    if (canvas && canvas.width > 0) {
      saveCanvasToFile(canvas);
    } else if (img && img.src) {
      if (img.complete) {
        saveCanvasToFile(img);
      } else {
        img.onload = () => saveCanvasToFile(img);
      }
    }
  }

  // 토스트 알림 표시 함수
  function showToast() {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // 초기 로딩 시 입력창 자동 포커스
  urlInput.focus();
});
