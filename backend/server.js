const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File parsing libraries
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'meiwa-super-secret-key';

app.use(cors());
app.use(express.json());

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const JWT_SECRET_VAR = "MEIWA_SECRET_2026";

// --- 0. AUTHENTICATION API ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });
    if (!user) return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });

    if (user.status !== 'Đang hoạt động') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role?.name }, JWT_SECRET_VAR, { expiresIn: '8h' });
    
    res.json({ success: true, token, user: { username: user.username, fullName: `${user.lastName} ${user.firstName}`, role: user.role?.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống đăng nhập' });
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Mật khẩu cũ không chính xác' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { username },
      data: { password: hashedNewPassword }
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đổi mật khẩu' });
  }
});

app.post('/api/update-profile', async (req, res) => {
  try {
    const { username, firstName, lastName, dob, gender, avatarUrl } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    await prisma.user.update({
      where: { username },
      data: { firstName, lastName, dob, gender, avatarUrl }
    });

    res.json({ success: true, message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật thông tin' });
  }
});

// --- 1. AUTH API ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });
    if (!user) return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role?.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role?.name } });

    await prisma.log.create({ data: { type: 'INFO', message: `${username} / Đăng nhập hệ thống` } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// --- 2. PARTNER APIs ---
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { id: 'desc' } });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const { name, fullName } = req.body;
    const partner = await prisma.partner.create({ data: { name, fullName } });
    await prisma.log.create({ data: { type: 'INFO', message: `Đã thêm đối tác: ${name}` } });
    res.json({ success: true, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm đối tác' });
  }
});

app.put('/api/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullName, status } = req.body;
    const partner = await prisma.partner.update({ where: { id: Number(id) }, data: { name, fullName, status } });
    res.json({ success: true, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi' });
  }
});

app.delete('/api/partners/:id', async (req, res) => {
  try {
    await prisma.partner.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi' });
  }
});


// --- 3. PRODUCT APIs ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { partner: true }, orderBy: { id: 'desc' } });
    const formatted = products.map(p => ({
      id: p.id, partnerId: p.partnerId, partner: p.partner.name, name: p.name, code: p.code, created: p.createdAt, modified: p.updatedAt, status: p.status
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, code, partnerId } = req.body;
    const product = await prisma.product.create({ data: { name, code, partnerId: Number(partnerId) } });
    await prisma.log.create({ data: { type: 'INFO', message: `Đã thêm sản phẩm: ${name} (${code})` } });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm sản phẩm' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, partnerId, status } = req.body;
    const product = await prisma.product.update({ where: { id: Number(id) }, data: { name, code, partnerId: Number(partnerId), status } });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi' });
  }
});


// --- 4. PACKING LIST & DOCUMENTS API ---
app.get('/api/packing-list', async (req, res) => {
  try {
    const lists = await prisma.packingList.findMany({ orderBy: { id: 'desc' } });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// --- 5. SCAN AND VERIFY API ---
app.post('/api/scan/verify', async (req, res) => {
  try {
    const { barcode } = req.body;
    // Giả định định dạng Barcode: Code|LotNo|Quantity|BoxNo|SerialNo
    // Ví dụ: ME-1E|Q0309B|2400|29|SR-12345
    const parts = barcode.split('|');
    if (parts.length < 3) {
      return res.status(400).json({ success: false, message: 'Mã vạch không đúng định dạng chuẩn!' });
    }

    const code = parts[0]?.trim();
    const lotNo = parts[1]?.trim();
    const quantity = parseInt(parts[2]?.trim() || '0');
    const boxNo = parts[3]?.trim();
    const seriNumber = parts[4]?.trim();

    const errors = [];

    // 1. Kiểm tra Packing List (Đối chiếu toàn diện)
    let packingQuery = { code, lotNo, quantity };
    if (boxNo) packingQuery.boxNo = boxNo;
    // Tạm bỏ qua seriNumber nếu Packing List mẫu không có để tránh lỗi POC, nhưng có thể thêm vào logic
    const packMatch = await prisma.packingList.findFirst({ where: packingQuery });
    
    if (!packMatch) {
      errors.push(`Packing List: Không tìm thấy thùng hàng khớp (Code: ${code}, Lot: ${lotNo}, Qty: ${quantity}, Box: ${boxNo || 'N/A'})`);
    } else if (seriNumber && packMatch.seriNumber && packMatch.seriNumber !== seriNumber) {
      errors.push(`Packing List: Lệch số Seri (Thực tế: ${seriNumber} - Packing: ${packMatch.seriNumber})`);
    }

    // 2. Kiểm tra Invoice (Đối chiếu Số lượng)
    const invoiceMatch = await prisma.invoice.findFirst({ where: { code } });
    if (!invoiceMatch) {
      errors.push(`Invoice: Không tìm thấy sản phẩm ${code} trong hóa đơn.`);
    }

    // 3. Kiểm tra Truyền phiếu ProcessDoc (Đối chiếu Lô)
    const processMatch = await prisma.processDoc.findFirst({ where: { code, lotNo } });
    if (!processMatch) {
      errors.push(`Truyền phiếu: Không tìm thấy Lô ${lotNo} cho sản phẩm ${code}.`);
    }

    const isOk = errors.length === 0;

    // Lưu Log Quét Tem
    await prisma.log.create({ 
      data: { 
        type: isOk ? 'INFO' : 'ERROR', 
        message: `Quét mã: ${barcode} -> ${isOk ? 'HỢP LỆ (CHO XUẤT)' : 'LỖI: ' + errors.join('; ')}` 
      } 
    });

    if (isOk) {
      res.json({ success: true, message: 'OK - CHO PHÉP XUẤT', data: { code, lotNo, boxNo } });
    } else {
      res.status(200).json({ success: false, message: 'NG - KHÔNG ĐƯỢC XUẤT', errors });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi quét tem' });
  }
});

// --- 6. ROLES & ACCOUNTS API ---
// Roles
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { id: 'desc' } });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});
app.post('/api/roles', async (req, res) => {
  try {
    const { name } = req.body;
    const role = await prisma.role.create({ data: { name } });
    res.json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm Role' });
  }
});
app.put('/api/roles/:id', async (req, res) => {
  try {
    const { name, status } = req.body;
    const role = await prisma.role.update({ where: { id: Number(req.params.id) }, data: { name, status } });
    res.json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi sửa Role' });
  }
});
app.delete('/api/roles/:id', async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa Role' });
  }
});

// Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { role: true }, orderBy: { id: 'desc' } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});
app.post('/api/accounts', async (req, res) => {
  try {
    const { username, password, firstName, lastName, roleId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword, firstName, lastName, roleId: Number(roleId) } });
    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm Account (Có thể trùng Username)' });
  }
});
app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { username, firstName, lastName, roleId, status, password } = req.body;
    const dataToUpdate = { username, firstName, lastName, roleId: Number(roleId), status };
    
    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: dataToUpdate });
    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi sửa Account' });
  }
});
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa Account' });
  }
});

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.log.findMany({ orderBy: { id: 'desc' }, take: 200 }); // Lấy 200 log gần nhất
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const productCount = await prisma.product.count();
    const partnerCount = await prisma.partner.count();
    const packCount = await prisma.packingList.count();
    const invoiceCount = await prisma.invoice.count();
    const processCount = await prisma.processDoc.count();
    const scanOkCount = await prisma.log.count({ where: { type: 'INFO', message: { contains: 'CHO XUẤT' } } });
    const scanNgCount = await prisma.log.count({ where: { type: 'ERROR' } });

    res.json({
      success: true,
      data: {
        products: productCount,
        partners: partnerCount,
        packingLists: packCount,
        invoices: invoiceCount,
        processDocs: processCount,
        scanOk: scanOkCount,
        scanNg: scanNgCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// API Lấy danh sách Invoice và ProcessDoc
app.get('/api/invoices', async (req, res) => {
  try {
    const lists = await prisma.invoice.findMany({ orderBy: { id: 'desc' } });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});
app.get('/api/process-docs', async (req, res) => {
  try {
    const lists = await prisma.processDoc.findMany({ orderBy: { id: 'desc' } });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Hàm hỗ trợ bóc tách Regex từ Text thô (Cho PDF, Word, Ảnh)
const parseUnstructuredText = (text, docType) => {
  const lotMatch = text.match(/(?:Lot|LotNo)[:\-]?\s*([A-Za-z0-9]+)/i);
  const qtyMatch = text.match(/(?:Qty|Quantity|Số lượng)[:\-]?\s*([0-9,.]+)/i);
  const boxMatch = text.match(/(?:Box|BoxNo|Thùng)[:\-]?\s*([A-Za-z0-9]+)/i);
  const codeMatch = text.match(/(?:Code|Mã)[:\-]?\s*([A-Za-z0-9\-]+)/i);
  const itemMatch = text.match(/(?:Item|Sản phẩm)[:\-]?\s*([A-Za-z0-9\-]+)/i);
  const poMatch = text.match(/(?:PO|Order|Đơn hàng)[:\-]?\s*([A-Za-z0-9\-]+)/i);
  const docNoMatch = text.match(/(?:InvoiceNo|DocNo|Số phiếu)[:\-]?\s*([A-Za-z0-9\-]+)/i);

  const base = {
    code: codeMatch ? codeMatch[1] : 'UNKNOWN-CODE',
    quantity: qtyMatch ? parseInt(qtyMatch[1].replace(/,/g, '')) : 1000,
  };

  if (docType === 'invoice') {
    return {
      ...base,
      invoiceNo: docNoMatch ? docNoMatch[1] : `INV-${Math.floor(Math.random()*100)}`,
      poNumber: poMatch ? poMatch[1] : 'UNKNOWN-PO'
    };
  } else if (docType === 'process_doc') {
    return {
      ...base,
      docNo: docNoMatch ? docNoMatch[1] : `DOC-${Math.floor(Math.random()*100)}`,
      lotNo: lotMatch ? lotMatch[1] : 'UNKNOWN-LOT'
    };
  }

  // Mặc định là packing_list
  return {
    ...base,
    boxNo: boxMatch ? boxMatch[1] : `B-${Math.floor(Math.random()*100)}`,
    lotNo: lotMatch ? lotMatch[1] : 'UNKNOWN-LOT',
    item: itemMatch ? itemMatch[1] : 'UNKNOWN-ITEM',
    poNumber: poMatch ? poMatch[1] : 'UNKNOWN-PO',
    rank: '20-A', // Default/Mock for POC
    total: base.quantity * 40
  };
};

// API Upload Đa định dạng
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file' });
    const docType = req.body.docType || 'packing_list'; // 'packing_list' | 'invoice' | 'process_doc'

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filePath = req.file.path;
    let extractedDataList = [];

    // 1. ĐỌC EXCEL
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      
      // Giả định Excel có các cột: BoxNo, Code, LotNo, Item, Quantity, PO
      extractedDataList = jsonData.map(row => {
        const base = {
          code: String(row['Code'] || 'UNKNOWN'),
          quantity: parseInt(row['Quantity'] || row['Qty'] || 1000)
        };
        if (docType === 'invoice') {
          return {
            ...base,
            invoiceNo: String(row['InvoiceNo'] || row['DocNo'] || `INV-${Math.floor(Math.random()*100)}`),
            poNumber: String(row['PO'] || row['Order'] || 'UNKNOWN')
          };
        } else if (docType === 'process_doc') {
          return {
            ...base,
            docNo: String(row['DocNo'] || `DOC-${Math.floor(Math.random()*100)}`),
            lotNo: String(row['LotNo'] || row['Lot'] || 'UNKNOWN')
          };
        }
        return {
          ...base,
          boxNo: String(row['BoxNo'] || row['Box'] || `B-${Math.floor(Math.random()*100)}`),
          lotNo: String(row['LotNo'] || row['Lot'] || 'UNKNOWN'),
          item: String(row['Item'] || 'UNKNOWN'),
          poNumber: String(row['PO'] || row['Order'] || 'UNKNOWN'),
          rank: String(row['Rank'] || '20-A'),
          total: parseInt(row['Total'] || 40000)
        };
      });
    }
    // 2. ĐỌC PDF
    else if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedDataList.push(parseUnstructuredText(data.text, docType));
    }
    // 3. ĐỌC WORD
    else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedDataList.push(parseUnstructuredText(result.value, docType));
    }
    // 4. ĐỌC ẢNH (OCR)
    else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng+vie');
      extractedDataList.push(parseUnstructuredText(text, docType));
    }
    else {
      fs.unlinkSync(filePath); // Xóa file không hợp lệ
      return res.status(400).json({ success: false, message: 'Định dạng file không hỗ trợ!' });
    }

    // Lưu tất cả dữ liệu trích xuất vào DB
    const createdRecords = [];
    for (const data of extractedDataList) {
      if (data.code !== 'UNKNOWN') { // Chỉ lưu nếu đọc ra được Code
        let record;
        if (docType === 'invoice') record = await prisma.invoice.create({ data });
        else if (docType === 'process_doc') record = await prisma.processDoc.create({ data });
        else record = await prisma.packingList.create({ data });
        createdRecords.push(record);
      }
    }

    // Xóa file tạm
    fs.unlinkSync(filePath);

    await prisma.log.create({ data: { type: 'INFO', message: `Đã import dữ liệu từ file ${req.file.originalname}` } });
    
    res.json({ 
      success: true, 
      message: `Bóc tách thành công ${createdRecords.length} dòng dữ liệu!`, 
      data: createdRecords 
    });

  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Lỗi khi xử lý file' });
  }
});

// Cấu hình phục vụ giao diện tĩnh (Frontend React)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route: trả về index.html cho các route không phải API (dành cho React Router)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
