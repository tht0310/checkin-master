const exceljs = require('exceljs');
var shell = require('shelljs');


var Export = module.exports = {
  d2al: (n) => {
    for (var ret = '', a = 1, b = 26; (n -= a) >= 0; a = b, b *= 26) {
      ret = String.fromCharCode(parseInt((n % b) / a) + 65) + ret;
    }

    return ret;
  },
  writeExcel: (wb, cb) => {
    var Excel = exceljs;
    var workbook = new Excel.Workbook();
    for (var i = 1; i <= wb.sheets.length; i++) {
      var dataSheet = wb.sheets[i - 1]
      var worksheet = workbook.addWorksheet((dataSheet.name) ? dataSheet.name : 'sheet' + i, { state: 'visible' })

      dataSheet.cells.forEach(function (cell) {
        var cellname = Export.d2al(cell.col) + cell.row
        if (cell.text != null) {
          worksheet.getCell(cellname).value = cell.text
        }
        if (cell.formula != null) {
          worksheet.getCell(cellname).formula = cell.formula
        }
        if (cell.font != null) {
          worksheet.getCell(cellname).style.font = cell.font
        }
        if (cell.alignment != null) {
          worksheet.getCell(cellname).alignment = cell.alignment
        }
        if (cell.border != null) {
          worksheet.getCell(cellname).border = cell.border
        }
        if (cell.fill != null) {
          worksheet.getCell(cellname).fill = cell.fill
        }
        if (cell.width != null) {
          worksheet.getColumn(cell.col).width = cell.width
        }
        if (cell.height != null) {
          worksheet.getRow(cell.row).height = cell.height
        }
        if (cell.merge != null) {
          var cellMerge = Export.d2al(cell.merge[0].col) + cell.merge[0].row + ":" + Export.d2al(cell.merge[1].col) + cell.merge[1].row
          worksheet.mergeCells(cellMerge)
        }
        if (cell.numFmt != null) {
          worksheet.getCell(cellname).numFmt = cell.numFmt
        }
        if (cell.note != null) {
          worksheet.getCell(cellname).note = cell.note;
        }

        if (cell.image != null) {
          const img = workbook.addImage({ base64: cell.image, extension: 'png' });
          // worksheet.addImage(img, cellname+":"+cellname);
          worksheet.addImage(img, { tl: { col: cell.col - 1, row: cell.row - 1 }, ext: { width: 100, height: 100 } });
        }
      })
    }
    var filename = (wb.filename != null) ? wb.filename : "Report" + Util.now('YY_MM_DD_hh_mm_ss_x') + '.xlsx'
    workbook.xlsx.writeFile(filename).then(function () {
      cb(filename)
    })
  },

  excelTimesheet1: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const wrapTopCenter = { wrapText: true, vertical: 'top', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const middleRight = { vertical: 'middle', horizontal: 'right' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const fontSBody = { name: fontName, size: 6 };
    const fontMBody = { name: fontName, size: 9 };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const fillWeekend = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'fbe5d6' }, bgColor: { argb: 'fbe5d6' } };
    const fillRed = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'd99999' }, bgColor: { argb: 'd99999' } };

    const rheader = 4;
    const rbody = 6;

    var nDay = moment(obj.toDate).diff(moment(obj.fromDate), 'days', true) + 1;

    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'Bang_Cham_Cong';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Báo Cáo Tổng hơp chấm công",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày bắt đầu làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cRow = rheader;

    var dom = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);
    var firstDateCol = cCol + 1;
    var lastDateCol = Number(firstDateCol) + Number(nDay);

    //Set Header Title
    for (i = firstDateCol; i < lastDateCol; i++) {

      sheet.cells.push({
        col: i, row: cRow, text: dom.format("DD/MM"),
        font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
        width: 5
      });

      var idx_dow = parseInt(dom.format("E")) + 1;
      var dow = (idx_dow != 8) ? 'Thứ ' + idx_dow : 'Chủ Nhật';

      sheet.cells.push({
        col: i, row: cRow + 1, text: dow,
        font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
        // fill: (idx_dow == 8 || idx_dow == 7) ? fillWeekend : null,
        width: 5, height: 40
      });

      dom = dom.add(step, 'days');
    }

    cCol = lastDateCol;
    cRow = rheader;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tổng',
      merge: [{ col: cCol, row: cRow }, { col: cCol + 1, row: cRow }],
      font: fontHeader, border: borderHeader, width: 15, alignment: wrapMiddleCenter
    });

    sheet.cells.push({
      col: cCol, row: cRow + 1, text: 'Ngày Công',
      font: fontHeader, border: borderHeader, width: 7, alignment: wrapMiddleCenter
    });
    cCol++;


    sheet.cells.push({
      col: cCol, row: cRow + 1, text: 'Công Cơm',
      font: fontHeader, border: borderHeader, width: 7, alignment: wrapMiddleCenter
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày nghỉ',
      merge: [{ col: cCol, row: cRow }, { col: cCol + 1, row: cRow }],
      font: fontHeader, border: borderHeader, alignment: wrapTopCenter
    });
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Nghỉ phép',
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 7
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Nghỉ Khác',
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 7
    });

    cCol++;
    cRow = rheader;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tăng ca',
      merge: [{ col: cCol, row: cRow }, { col: cCol + 2, row: cRow }],
      font: fontHeader, border: borderHeader, alignment: wrapTopCenter
    });
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày thường',
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 7
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày nghỉ',
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 7
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày Lễ',
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 7
    });
    cCol++;

    // Set Data
    for (var i = 0; i < nUser; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var tmpFromDate = (step == -1) ? moment(obj.fromDate) : moment(obj.toDate);
      var tmpToDate = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);

      var employee = obj[i];

      cCol = 1;

      //ma nhan vien 
      sheet.cells.push({
        col: cCol++, row: r, text: employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //name
      sheet.cells.push({
        col: cCol++, row: r, text: employee.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Chuc vu
      sheet.cells.push({
        col: cCol++, row: r, text: employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay bat dau vao lam
      sheet.cells.push({
        col: cCol++, row: r, text: Util.getDate(employee.startAt, "DD/MM/YYYY"),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      cCol = firstDateCol;

      while (tmpToDate.diff(tmpFromDate, 'days', true) != step) {
        var d = tmpToDate.format("YYYY-MM-DD")
        var idx_dow = parseInt(tmpToDate.format("E")) + 1;
        var code = (employee.timesheet[d] && employee.timesheet[d].code) ? employee.timesheet[d].code.value : "";
        var codeOT = (employee.timesheet[d] && employee.timesheet[d].codeOT) ? employee.timesheet[d].codeOT.value : "";
        var note = null;

        if (employee.timesheet[d] && (employee.timesheet[d].comment || employee.timesheet[d].note)) {
          let txtNote = ((employee.timesheet[d].comment) ? "Phép: " + employee.timesheet[d].comment + "\n" : "") + ((employee.timesheet[d].note) ? "Ghi Chú: " + employee.timesheet[d].note : "");

          note = {
            texts: [{
              font: { size: 12, color: { argb: 'FFFF6600' }, name: 'Calibri', family: 2, scheme: 'minor' },
              text: txtNote
            }],
            margins: { insetmode: 'custom', inset: [0.25, 0.25, 0.35, 0.35] },
            protection: { locked: true, lockText: false },
            editAs: 'twoCells',
          };
        }

        var fillInWhile = null;

        if (code == "") {
          fillInWhile = fillWeekend;
        }
        else if (arrCode.indexOf(code) >= 0) {
          fillInWhile = fillRed;
        }

        if (code && codeOT) {
          code = code + "," + codeOT;

          if (codeOT.indexOf("CC") != -1) {
            code = codeOT
          }
        }
        else {
          code = code || codeOT;
        }

        var font = fontBody;

        if (code.length > 6) {
          font = fontSBody;
        }
        else if (code.length >= 5) {
          font = fontMBody;
        }

        sheet.cells.push({
          col: cCol, row: r, text: code, note: note,
          font: font, fill: fillInWhile, border: borderRow, alignment: wrapMiddleCenter,

        });
        cCol++;

        tmpToDate.add(step, 'days');
      }

      cCol = lastDateCol;
      //Tong Ngay Cong
      sheet.cells.push({
        col: cCol++, row: r, text: employee.wd.value,
        font: fontBody, border: borderRow, alignment: middleRight
      });

      //Tong Cong Com
      sheet.cells.push({
        col: cCol++, row: r, text: employee.CC.value,
        font: fontBody, border: borderRow, alignment: middleRight
      });

      //So ngay nghi phep
      sheet.cells.push({
        col: cCol++, row: r, text: employee.n_codeP.value,
        font: fontBody, border: borderRow, alignment: middleRight
      });

      //Nghi khac
      sheet.cells.push({
        col: cCol++, row: r, text: employee.n_codeK.value,
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //OT ngay thuong
      sheet.cells.push({
        col: cCol++, row: r, text: employee.wtD.value,
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //OT ngay nghi
      sheet.cells.push({
        col: cCol++, row: r, text: employee.wtO.value,
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //OT ngay nghi
      sheet.cells.push({
        col: cCol++, row: r, text: employee.wtH.value,
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      if (obj.detail == true) {
        cCol = lastDateCol + 7;

        var hours = Math.floor(employee.wt.value / 60);
        var minutes = employee.wt.value % 60;
        var hoursOfWork = hours.toString() + "h " + minutes.toString() + "m";

        //So lan di tre
        sheet.cells.push({
          col: cCol, row: r, text: employee.n_lateIn.value,
          font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
        });
        cCol++;
        //So lan ve som
        sheet.cells.push({
          col: cCol, row: r, text: employee.n_earlyOut.value,
          font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
        });
        cCol++;
        //So lan khong cham cong
        sheet.cells.push({
          col: cCol, row: r, text: employee.n_noIn.value,
          font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
        });
        cCol++;
        //So lan khong cham cong ra
        sheet.cells.push({
          col: cCol, row: r, text: employee.n_noOut.value,
          font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
        });
      }
    }

    if (obj.detail == true) {
      //Tổng số giờ công trong tháng	Số lần đi muộn	Số lần về sớm	Số ngày không chấm công	Số ngày không chấm công vào	Số ngày không chấm công ra
      cCol = lastDateCol + 7;
      cRow = rheader;

      sheet.cells.push({
        col: cCol, row: cRow, text: 'Số lần đi muộn',
        merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });
      cCol++;
      sheet.cells.push({
        col: cCol, row: cRow, text: 'Số lần về sớm',
        merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      cCol++;
      sheet.cells.push({
        col: cCol, row: cRow, text: 'Số ngày không chấm công',
        merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      cCol++;
      sheet.cells.push({
        col: cCol, row: cRow, text: 'Số ngày không chấm công ra',
        merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
        font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });
    }
    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "BaoCaoChamCongTongHopThang_" + Util.now('MM-YYYY') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://checkin.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },

  excelTimesheet2: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const wrapTopCenter = { wrapText: true, vertical: 'top', horizontal: 'center' };
    const middleCenter = { vertical: 'middle', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const middleRight = { vertical: 'middle', horizontal: 'right' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const fontSBody = { name: fontName, size: 6 };
    const fontMBody = { name: fontName, size: 9 };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const fillWeekend = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'fbe5d6' }, bgColor: { argb: 'fbe5d6' } };
    const fillRed = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'd99999' }, bgColor: { argb: 'd99999' } };

    const rheader = 4;
    const rbody = 6;

    var nDay = Number(moment(obj.toDate).diff(moment(obj.fromDate), 'days', true)) + 1;

    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'Bang_Cham_Cong_Ca_Kip';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Báo Cáo Tổng hơp chấm công theo ca kíp",
      merge: [{ col: cCol, row: cRow }, { col: cCol + 5, row: cRow + 1 }],
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày bắt đầu làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });


    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên Ca',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 20,
    });

    var firstDateCol = cCol + 1;
    cRow = rheader;
    var dom = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);
    var lastDateCol = Number(firstDateCol) + Number(nDay);

    //Set Date Header Title
    for (i = firstDateCol; i < lastDateCol; i++) {

      sheet.cells.push({
        col: i, row: cRow, text: dom.format("DD/MM"),
        font: fontHeader, border: borderHeader, alignment: middleCenter,
        width: 5
      });

      var idx_dow = parseInt(dom.format("E")) + 1;
      var dow = (idx_dow != 8) ? 'Thứ ' + idx_dow : 'Chủ Nhật';

      sheet.cells.push({
        col: i, row: cRow + 1, text: dow,
        font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
        // fill: (idx_dow == 8 || idx_dow == 7) ? fillWeekend : null,
        width: 5, height: 40
      });

      dom = dom.add(step, 'days');
    }

    //Set Sum Header Title
    sheet.cells.push({
      col: lastDateCol, row: rheader, text: 'Tổng theo ca',
      merge: [{ col: lastDateCol, row: rheader }, { col: lastDateCol, row: rheader + 1 }],
      font: fontHeader, border: borderHeader, width: 15, alignment: wrapMiddleCenter
    });

    //Set Sum Header Title
    sheet.cells.push({
      col: lastDateCol + 1, row: rheader, text: 'Tổng',
      merge: [{ col: lastDateCol + 1, row: rheader }, { col: lastDateCol + 1, row: rheader + 1 }],
      font: fontHeader, border: borderHeader, width: 15, alignment: wrapMiddleCenter
    });

    // Set Data
    var ri = Number(rbody);

    for (var i = 0; i < nUser; i++) {
      var employee = obj[i];
      cCol = 1;
      var nShift = employee.timesheet.total.length - 1;
      nShift = (nShift > 0) ? nShift : 0;
      ri_nShift = (nShift > 0) ? ri + nShift : ri;

      //ma nhan vien 
      sheet.cells.push({
        col: cCol, row: ri, text: employee.no || "...",
        // merge: [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }],
        merge: (nShift > 0) ? [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }] : null,
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });
      cCol++

      // name
      sheet.cells.push({
        col: cCol, row: ri, text: employee.name,
        // merge: [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }],
        merge: (nShift > 0) ? [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }] : null,
        font: fontBody, border: borderRow, alignment: middleLeft
      });
      cCol++

      //Phong ban
      sheet.cells.push({
        col: cCol, row: ri, text: employee.department,
        // merge: [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }],
        merge: (nShift > 0) ? [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }] : null,
        font: fontBody, border: borderRow, alignment: middleLeft
      });
      cCol++

      //Chuc vu
      sheet.cells.push({
        col: cCol, row: ri, text: employee.position,
        // merge: [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }],
        merge: (nShift > 0) ? [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }] : null,
        font: fontBody, border: borderRow, alignment: middleLeft
      });
      cCol++

      //Ngay bat dau vao lam
      sheet.cells.push({
        col: cCol, row: ri, text: Util.getDate(employee.startAt, "MM/DD/YYYY"),
        // merge: [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }],
        merge: (nShift > 0) ? [{ col: cCol, row: ri }, { col: cCol, row: ri_nShift }] : null,
        font: fontBody, border: borderRow, alignment: middleLeft
      });
      cCol++

      for (let s = 0; s <= nShift; s++) {
        let total = employee.timesheet.total[s]
        if (!total) {
          break;
        }
        let sId = total.sId;
        let sName = total.sName;
        let sColor = total.sColor;
        cCol = firstDateCol;

        let color = "000000"

        if (sId == "0") {
          color = "FF0000"
        }

        if (sColor && sColor != "default") {
          color = sColor;
        }

        let fontRow = fontBody;

        if (color != "000000") {
          fontRow = { name: fontName, size: fontSize, color: { argb: color } };
        }

        // logger.info(sId, sName)

        //Ten Ca
        sheet.cells.push({
          col: cCol - 1, row: ri + s, text: sName,
          font: fontRow, border: borderRow, alignment: middleLeft
        });

        let sumWT = (total.wt && total.wt.value && total.wt.value > 0) ? total.wt.value : 0
        let unit = (total.wt && total.wt.unit) ? total.wt.unit : "P"

        //Tong theo Ca
        sheet.cells.push({
          col: lastDateCol, row: ri + s, text: sumWT, numFmt: "0.0" + unit,
          font: fontRow, border: borderRow, alignment: middleLeft
        });

        if (sId == "0") {
          // let unit = (total.wt && total.wt.unit) ? total.wt.unit : "P"
          //Tong Nghi Phep
          sheet.cells.push({
            col: lastDateCol + 1, row: ri + s, text: sumWT, //numFmt: "0.0" + unit,
            font: fontRow, border: borderRow, alignment: middleRight
          });
        }

        var tmpFromDate = (step == -1) ? moment(obj.fromDate) : moment(obj.toDate);
        var tmpToDate = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);

        while (tmpToDate.diff(tmpFromDate, 'days', true) != step) {
          let d = tmpToDate.format("YYYY-MM-DD")

          // Set Data

          let timesheet = employee.timesheet[d];
          // logger.info(JSON.stringify(timesheet))

          if (timesheet && timesheet[sId]) {
            let ts = timesheet[sId]
            logger.info(sId, JSON.stringify(ts))
            text = (ts.wt && ts.wt.value) ? ts.wt.value : null;

            sheet.cells.push({
              col: cCol, row: ri + s, text: text, numFmt: "0.0" + unit,
              font: fontRow, border: borderRow, alignment: wrapMiddleCenter
            });
          }
          else {
            sheet.cells.push({
              col: cCol, row: ri + s,
              fill: fillWeekend, border: borderRow
            });
          }

          cCol++;
          tmpToDate.add(step, 'days');
        }
      }

      if (employee.wt) {
        //Tong
        let text = employee.wt.value;
        let unit = (employee.wt.unit || "");
        sheet.cells.push({
          col: lastDateCol + 1, row: ri + 1, text: text,// numFmt: "0.0" + unit,
          merge: [{ col: lastDateCol + 1, row: ri + 1 }, { col: lastDateCol + 1, row: ri_nShift }],
          font: fontBody, border: borderRow, alignment: middleRight
        });
      }

      ri += nShift + 1;
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "BaoCaoChamCongTongHopCaKipThang_" + Util.now('MM-YYYY') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://checkin.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },

  excelTimesheetLog: (obj, callback) => {
    var nTimesheet = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const wrapTopCenter = { wrapText: true, vertical: 'top', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const middleRight = { vertical: 'middle', horizontal: 'right' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const rheader = 4;
    const rbody = 6;


    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'Bang_Cham_Cong';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Báo Cáo chấm công chi tiết",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'STT',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày bắt đầu làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    //Ngày Chấm Công	Giờ vào	Giờ ra	Số giờ làm việc
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày Chấm Công',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });


    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Giờ vào',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Giờ ra',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Số giờ làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });


    for (var i = 0; i < nTimesheet; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var log = obj[i];
      cCol = 1;

      //ma nhan vien 
      sheet.cells.push({
        col: cCol++, row: r, text: i + 1,
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //ma nhan vien 
      sheet.cells.push({
        col: cCol++, row: r, text: log.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //name
      sheet.cells.push({
        col: cCol++, row: r, text: log.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: log.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Chuc vu
      sheet.cells.push({
        col: cCol++, row: r, text: log.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay cham cong
      sheet.cells.push({
        col: cCol++, row: r, text: Util.getDate(log.startAt, "MM/DD/YYYY"),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay cham cong
      sheet.cells.push({
        col: cCol++, row: r, text: Util.getDate(log.d, "MM/DD/YYYY"),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Gio vao
      sheet.cells.push({
        col: cCol++, row: r, text: log.inAt,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Gio ra
      sheet.cells.push({
        col: cCol++, row: r, text: log.outAt,
        font: fontBody, border: borderRow, alignment: middleLeft
      });


      var hours = Math.floor(log.wt / 60);
      var minutes = log.wt % 60;
      var hoursOfWork = hours.toString() + "h " + minutes.toString() + "m";

      //So gio lam viec
      sheet.cells.push({
        col: cCol++, row: r, text: hoursOfWork,
        font: fontBody, border: borderRow, alignment: middleLeft
      });
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "BaoCaoChamCongTongHopThang_" + Util.now('MM-YYYY') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://checkin.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    // workbook.filename = (filename ? (filename + '.xlsx') : "Export_" + Util.now('YY_MM_DD_hh_mm_ss_x') + '.xlsx');
    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },

  excelCheckinLog: (obj, callback) => {
    var nLog = obj.log.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const wrapTopCenter = { wrapText: true, vertical: 'top', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const middleRight = { vertical: 'middle', horizontal: 'right' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const rheader = 4;
    const rbody = 6;


    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'CheckinLog';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Checkin Log",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'STT',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    //Ngày Chấm Công
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày Chấm Công',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    //Kiểu chấm công
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Kiểu Chấm Công',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 15,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 15,
    });


    //Ngày Chấm Công	Giờ vào	Giờ ra	Số giờ làm việc
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Vị trí/Tọa độ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 60,
    });

    //Ban kinh
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Bán kính',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    //Pham vi
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Nơi chấm',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });



    for (var i = 0; i < nLog; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var log = obj.log[i];
      cCol = 1;

      //STT 
      sheet.cells.push({
        col: cCol++, row: r, text: i + 1,
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });


      //Ngay cham cong
      sheet.cells.push({
        col: cCol++, row: r, text: Util.getDate(log.d, "MM/DD/YYYY"),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      var checkBy = (log.l == "qr") ? "Quét mã QR" : ((log.l == "acct") ? "Kết nối Wifi" : "Chứng thực MAC")
      //Kieu cham
      sheet.cells.push({
        col: cCol++, row: r, text: checkBy,
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //ma nhan vien 
      sheet.cells.push({
        col: cCol++, row: r, text: log.employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //name
      sheet.cells.push({
        col: cCol++, row: r, text: log.employee.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: log.employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Chuc vu
      sheet.cells.push({
        col: cCol++, row: r, text: log.employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Vi tri/ toa do
      sheet.cells.push({
        col: cCol++, row: r, text: (log.location) ? log.location.name : ("'" + log.lat + ", " + log.long),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ban kinh
      sheet.cells.push({
        col: cCol++, row: r, text: log.radius + "m",
        font: fontBody, border: borderRow, alignment: middleLeft
      });


      var invalid = (log.invalid == "no") ? "Đúng vị trí" : "Sai vị trí";

      //Ban kinh
      sheet.cells.push({
        col: cCol++, row: r, text: invalid,
        font: fontBody, border: borderRow, alignment: middleLeft
      });
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "CheckinLog_" + Util.now('MM-YYYY') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://checkin.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    // workbook.filename = (filename ? (filename + '.xlsx') : "Export_" + Util.now('YY_MM_DD_hh_mm_ss_x') + '.xlsx');
    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },
  excelLOA: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const wrapTopCenter = { wrapText: true, vertical: 'top', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const middleRight = { vertical: 'middle', horizontal: 'right' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const fontSBody = { name: fontName, size: 8 };

    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const fillWeekend = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'fbe5d6' }, bgColor: { argb: 'fbe5d6' } };
    const fillRed = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'ff0000' }, bgColor: { argb: 'ff0000' } };

    const rheader = 4;
    const rbody = 6;

    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'ThongKeNgayPhep';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Bảng Thống Kê Ngày Phép Nhân Viên",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày bắt đầu làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cRow = rheader;

    var dom = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);
    var firstDateCol = cCol + 1;

    // obj.fromDate = Util.now("YYYY-01-01");
    var nMonth = Math.round(moment(obj.toDate).diff(moment(obj.fromDate), 'months'));
    logger.debug("So thang", nMonth);
    nMonth *= 2;

    var dom = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);
    var lastDateCol = Number(firstDateCol) + Number(nMonth);

    //Set Month Header Title
    for (i = firstDateCol; i < lastDateCol; i += 2) {
      var m = "Tháng " + dom.format("MM");

      sheet.cells.push({
        col: i, row: cRow, text: m,
        font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
        merge: [{ col: i, row: cRow }, { col: i + 1, row: cRow }],
        width: 5
      });

      sheet.cells.push({
        col: i, row: cRow + 1, text: "Tổng",
        font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
        width: 5
      });

      sheet.cells.push({
        col: i + 1, row: cRow + 1, text: "Phiếp phép",
        font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
        width: 20
      });

      dom = dom.add(step, 'months');
    }

    cCol = firstDateCol + nMonth;
    cRow = rheader;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Số ngày phép khả dụng',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });

    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Số ngày phép đã nghỉ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });

    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tổng ngày phép đến cuối năm',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });

    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày phép năm cũ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });

    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Số thâm niên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });

    cCol++;

    // Set Data
    for (var i = 0; i < nUser; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var tmpFromDate = (step == -1) ? moment(obj.fromDate) : moment(obj.toDate);
      var tmpToDate = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);

      var employee = obj[i];

      cCol = 1;

      //ma nhan vien 
      sheet.cells.push({
        col: cCol++, row: r, text: employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //name
      sheet.cells.push({
        col: cCol++, row: r, text: employee.name,
        font: fontHeader, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Chuc vu
      sheet.cells.push({
        col: cCol++, row: r, text: employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay bat dau vao lam
      sheet.cells.push({
        col: cCol++, row: r, text: Util.getDate(employee.startAt, "MM/DD/YYYY"),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      cCol = firstDateCol;

      var tmpFromDate = (step == -1) ? moment(obj.fromDate) : moment(obj.toDate);
      var tmpToDate = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);

      var minheight = 10;

      while (Math.floor(tmpToDate.diff(tmpFromDate, 'months')) != step) {
        var m = tmpToDate.format("YYYY-MM");
        var loa = employee.loa[m];

        if (loa) {
          sheet.cells.push({
            col: cCol, row: r, text: loa.sum,
            font: fontSBody, border: borderRow, alignment: wrapMiddleCenter
          });

          var height = loa.listArrId.length * 10;

          minheight = Math.max(minheight, height);

          sheet.cells.push({
            col: cCol + 1, row: r, text: loa.listArrId.join("\n"),
            font: fontSBody, border: borderRow, alignment: wrapMiddleCenter,
            height: minheight
          });
        }
        tmpToDate.add(step, 'months');
        cCol += 2;
      }

      cCol = firstDateCol + nMonth;

      //So ngay phep kha dung
      sheet.cells.push({
        col: cCol++, row: r, text: employee.availableLeaveDay,
        font: fontHeader, border: borderRow, alignment: middleRight
      });

      //So ngay nghi phep da nghi
      sheet.cells.push({
        col: cCol++, row: r, text: employee.paidLeaveDay,
        font: fontBody, border: borderRow, alignment: middleRight
      });

      //Tổng ngày phép đến cuối năm
      sheet.cells.push({
        col: cCol++, row: r, text: employee.maxLeaveDay,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //Ngay Phep Nam cu
      sheet.cells.push({
        col: cCol++, row: r, text: employee.oldLeaveDay,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //Tham Nien
      sheet.cells.push({
        col: cCol++, row: r, text: employee.seniorityLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "BangThongKeNgayPhep_" + Util.now('MM-YYYY') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://checkin.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },
  excelQRCodeEmployee: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const rheader = 4;
    const rbody = 6;


    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'DSNV';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Danh sách nhân viên",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày sinh',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    ////////
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Điện thoại',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Email',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Giới tính',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày vào làm',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Văn phòng làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chính sách làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });


    //Mã nhân viên	Tên nhân viên	Phòng ban	Chức vụ	Ngày sinh	Điện thoại	Email	Giới tính	Ngày vào làm	Văn phòng làm việc	Chính sách làm việc

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Văn phòng làm việc',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Chính sách làm việc',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });


    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Chấm công bình thường',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Cho phép đi trễ',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });


    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Cho phép tăng ca',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });


    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Số thâm niên',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Phép năm cũ còn lại',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Số ngày nghỉ sử dụng phép năm mới',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Tổng ngày nghỉ',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 8,
    // });
    //////

    // cCol++;
    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Mã QR',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
    //   width: 10,
    // });

    cRow = rheader;

    // Set Data
    for (var i = 0; i < nUser; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var employee = obj[i];

      cCol = 1;

      //Ma
      sheet.cells.push({
        col: cCol++, row: r, text: employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //Ten
      sheet.cells.push({
        col: cCol++, row: r, text: employee.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //vi tri
      sheet.cells.push({
        col: cCol++, row: r, text: employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay sinh
      sheet.cells.push({
        col: cCol++, row: r, text: employee.birthday,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phone
      sheet.cells.push({
        col: cCol++, row: r, text: employee.phone,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //email
      sheet.cells.push({
        col: cCol++, row: r, text: employee.email,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //gender
      sheet.cells.push({
        col: cCol++, row: r, text: employee.gender,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //startAt
      sheet.cells.push({
        col: cCol++, row: r, text: employee.startAt,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      // //Location Id
      // sheet.cells.push({
      //   col: cCol++, row: r, text: employee.lId,
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //Policy Id
      // sheet.cells.push({
      //   col: cCol++, row: r, text: employee.lId,
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //Cham cong binh thuong
      // sheet.cells.push({
      //   col: cCol++, row: r, text: (employee.checkin) ? "Y" : "N",
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //Cho phep cham cong tre
      // sheet.cells.push({
      //   col: cCol++, row: r, text: (employee.checkin && employee.checkin.lateAllow) ? "Y" : "N",
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //Cho phep OT khi can
      // sheet.cells.push({
      //   col: cCol++, row: r, text: (employee.checkin && employee.checkin.OTAllow) ? "Y" : "N",
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //So tham nien
      // sheet.cells.push({
      //   col: cCol++, row: r, text: employee.seniorityLeaveDay,
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //So phep nam cu con lại
      // sheet.cells.push({
      //   col: cCol++, row: r, text: employee.oldLeaveDay,
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //So ngay phep da su dung cua nam moi
      // sheet.cells.push({
      //   col: cCol++, row: r, text: employee.paidNewLeaveDay,
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      // //Tong ngay nghi
      // sheet.cells.push({
      //   col: cCol++, row: r, text: employee.paidLeaveDay,
      //   font: fontBody, border: borderRow, alignment: middleLeft
      // });

      //qr
      sheet.cells.push({ col: cCol, row: r, border: borderRow, image: employee.qrcode64, height: 80, width: 11 });
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "Danh_sach_nhan_vien_(QR Code)_" + Util.now('YYYY-MM-DD') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://school.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },
  excelPasswordEmployee: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const rheader = 4;
    const rbody = 6;


    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'DSNV';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Danh sách nhân viên",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày sinh',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Điện thoại',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Email',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Giới tính',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày vào làm',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tài khoản',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mật khẩu khởi tạo',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cRow = rheader;

    // Set Data
    for (var i = 0; i < nUser; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var employee = obj[i];

      cCol = 1;

      //Ma
      sheet.cells.push({
        col: cCol++, row: r, text: employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //Ten
      sheet.cells.push({
        col: cCol++, row: r, text: employee.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //vi tri
      sheet.cells.push({
        col: cCol++, row: r, text: employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay sinh
      sheet.cells.push({
        col: cCol++, row: r, text: employee.birthday,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phone
      sheet.cells.push({
        col: cCol++, row: r, text: employee.phone,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //email
      sheet.cells.push({
        col: cCol++, row: r, text: employee.email,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //gender
      sheet.cells.push({
        col: cCol++, row: r, text: employee.gender,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //startAt
      sheet.cells.push({
        col: cCol++, row: r, text: employee.startAt,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //username
      sheet.cells.push({ col: cCol++, row: r, text: employee.username, font: fontBody, border: borderRow, alignment: middleLeft });

      //initPassword
      sheet.cells.push({ col: cCol++, row: r, text: employee.initPassword, font: fontBody, border: borderRow, alignment: middleLeft });
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "Danh_sach_nhan_vien_kem_mat_khau_khoi_tao_" + Util.now('YYYY-MM-DD') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://school.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },

  excelEmployee: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const rheader = 4;
    const rbody = 6;


    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'DSNV';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Danh sách nhân viên",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày sinh',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    ////////
    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Điện thoại',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Email',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Giới tính',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày vào làm',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Văn phòng làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chính sách làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ghi chú',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 20,
    });

    cRow = rheader;

    // Set Data
    for (var i = 0; i < nUser; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var employee = obj[i];

      cCol = 1;

      //Ma
      sheet.cells.push({
        col: cCol++, row: r, text: employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //Ten
      sheet.cells.push({
        col: cCol++, row: r, text: employee.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //vi tri
      sheet.cells.push({
        col: cCol++, row: r, text: employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay sinh
      sheet.cells.push({
        col: cCol++, row: r, text: employee.birthday,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Phone
      sheet.cells.push({
        col: cCol++, row: r, text: employee.phone,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //email
      sheet.cells.push({
        col: cCol++, row: r, text: employee.email,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //gender
      sheet.cells.push({
        col: cCol++, row: r, text: employee.gender,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //startAt
      sheet.cells.push({
        col: cCol++, row: r, text: employee.startAt,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Location Id
      sheet.cells.push({
        col: cCol++, row: r, text: (employee.location) ? employee.location.name : "",
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Policy Id
      sheet.cells.push({
        col: cCol++, row: r, text: employee.policy.name,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Layoff
      sheet.cells.push({
        col: cCol++, row: r, text: (employee.layoff == "yes") ? ("Nghỉ việc " + employee.endAt) : "",
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      if (employee.avatar) {
        let fullPath = PATH.join(CONF.PORTRAIT + employee.groupId + "/");
        let image = fullPath + employee._id;
        if (fs.existsSync(image)) {
          var imageBase64 = fs.readFileSync(image, 'base64');
          sheet.cells.push({ col: cCol, row: r, border: borderRow, image: imageBase64, height: 80, width: 11 });
        }
      }
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "Danh_sach_nhan_vien_" + Util.now('YYYY-MM-DD') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://school.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },
  excelLeaveDay: (obj, callback) => {
    var nUser = obj.length;
    const arrCode = ["4X,4P", "4X,4K", "K", "P", "N"];

    const fontName = 'Times New Roman';
    const fontSize = 10;
    const wrapMiddleCenter = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    const wrapTopCenter = { wrapText: true, vertical: 'top', horizontal: 'center' };
    const middleLeft = { vertical: 'middle', horizontal: 'left' };
    const middleRight = { vertical: 'middle', horizontal: 'right' };
    const fontHeader = { name: fontName, size: fontSize, color: { argb: '0070C0' }, bold: true };
    const fontBody = { name: fontName, size: fontSize };
    const fontSBody = { name: fontName, size: 8 };

    const borderHeader = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const borderRow = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const step = 1;
    const fillWeekend = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'fbe5d6' }, bgColor: { argb: 'fbe5d6' } };
    const fillRed = { type: 'pattern', pattern: 'darkDown', fgColor: { argb: 'ff0000' }, bgColor: { argb: 'ff0000' } };

    const rheader = 4;
    const rbody = 6;

    var workbook = {};
    workbook.sheets = [];

    var sheet = {};
    sheet.cells = [];
    sheet.name = 'ThongKeNgayPhep';

    var cRow = 1;
    var cCol = 1;

    cRow++;
    sheet.cells.push({
      col: cCol,
      row: cRow,
      text: "Bảng Thống Kê Ngày Phép Nhân Viên",
      font: { name: fontName, size: 16, bold: true },
      alignment: middleLeft,
      width: 5,
      height: 15
    });
    cRow++;
    cRow++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'Mã nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 10,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Tên nhân viên',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, alignment: wrapMiddleCenter,
      width: 20
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Phòng ban',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Chức vụ',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 8,
    });

    cCol++;
    sheet.cells.push({
      col: cCol, row: cRow, text: 'Ngày bắt đầu làm việc',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, alignment: wrapMiddleCenter, border: borderHeader,
      width: 10,
    });

    cRow = rheader;

    var dom = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);
    var firstDateCol = cCol + 1;

    var dom = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);
    var lastDateCol = Number(firstDateCol);

    cCol = firstDateCol;
    cRow = rheader;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'seniority',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'oldleaveday',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'newLeaveday',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'paidNewleaveday',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });
    cCol++;

    sheet.cells.push({
      col: cCol, row: cRow, text: 'paidLeaveday',
      merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
      font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    });
    cCol++;

    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Số ngày phép khả dụng',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    // });

    // cCol++;

    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Số ngày phép đã nghỉ',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    // });

    // cCol++;

    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Tổng ngày phép đến cuối năm',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    // });

    // cCol++;

    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Ngày phép năm cũ',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    // });

    // cCol++;

    // sheet.cells.push({
    //   col: cCol, row: cRow, text: 'Số thâm niên',
    //   merge: [{ col: cCol, row: cRow }, { col: cCol, row: cRow + 1 }],
    //   font: fontHeader, border: borderHeader, width: 10, alignment: wrapMiddleCenter
    // });

    cCol++;

    // Set Data
    for (var i = 0; i < nUser; i++) {
      var r = parseInt(rbody) + parseInt(i);
      var tmpFromDate = (step == -1) ? moment(obj.fromDate) : moment(obj.toDate);
      var tmpToDate = (step == -1) ? moment(obj.toDate) : moment(obj.fromDate);

      var employee = obj[i];

      cCol = 1;

      //ma nhan vien 
      sheet.cells.push({
        col: cCol++, row: r, text: employee.no || "...",
        font: fontBody, border: borderRow, alignment: wrapMiddleCenter
      });

      //name
      sheet.cells.push({
        col: cCol++, row: r, text: employee.name,
        font: fontHeader, border: borderRow, alignment: middleLeft
      });

      //Phong ban
      sheet.cells.push({
        col: cCol++, row: r, text: employee.department,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Chuc vu
      sheet.cells.push({
        col: cCol++, row: r, text: employee.position,
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      //Ngay bat dau vao lam
      sheet.cells.push({
        col: cCol++, row: r, text: Util.getDate(employee.startAt, "MM/DD/YYYY"),
        font: fontBody, border: borderRow, alignment: middleLeft
      });

      cCol = firstDateCol;

      //seniority	oldleaveday	newleaveday/available	paidnewleaveday	paidleaveday

      //seniority
      sheet.cells.push({
        col: cCol++, row: r, text: employee.seniorityLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //oldLeaveDay
      sheet.cells.push({
        col: cCol++, row: r, text: employee.oldLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //newLeaveDay
      sheet.cells.push({
        col: cCol++, row: r, text: employee.newLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //paidNewLeaveDay
      sheet.cells.push({
        col: cCol++, row: r, text: employee.paidNewLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //paidLeaveDay
      sheet.cells.push({
        col: cCol++, row: r, text: employee.paidLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      /*
      //So ngay phep kha dung
      sheet.cells.push({
        col: cCol++, row: r, text: employee.availableLeaveDay,
        font: fontHeader, border: borderRow, alignment: middleRight
      });

      //So ngay nghi phep da nghi
      sheet.cells.push({
        col: cCol++, row: r, text: employee.paidLeaveDay,
        font: fontBody, border: borderRow, alignment: middleRight
      });

      //Tổng ngày phép đến cuối năm
      sheet.cells.push({
        col: cCol++, row: r, text: employee.maxLeaveDay,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //Ngay Phep Nam cu
      sheet.cells.push({
        col: cCol++, row: r, text: employee.oldLeaveDay,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });

      //Tham Nien
      sheet.cells.push({
        col: cCol++, row: r, text: employee.seniorityLeaveDay || 0,
        font: fontBody, border: borderHeader, width: 10, alignment: wrapMiddleCenter
      });
      /** */
    }

    workbook.sheets.push(sheet);

    //Declare path store
    var _filename = "BangThongKeNgayPhep_" + Util.now('MM-YYYY') + '.xlsx';// File name without path
    var fullPath = PATH.join(CONF.EXPORT + obj.groupId + "/");
    // var url = "https://checkin.becawifi.vn/public/export/" + obj.groupId + "/" + _filename;

    shell.mkdir('-p', fullPath);

    workbook.filename = fullPath + _filename;

    Export.writeExcel(workbook, function (filename) {
      callback(filename, _filename, fullPath);
    });
  },
}
