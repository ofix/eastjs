<template>
  <el-form ref="form" label-position="top" :model="form" label-width="40px">
    <el-form-item label="Pdf File Name">
      <el-input v-model="form.pdfName" placeholder="请输入PDF文件名"></el-input>
    </el-form-item>
    <el-form-item label="Pdf Entry URL">
      <el-input v-model="form.pdfEntry" placeholder="请输入URL"></el-input>
    </el-form-item>
    <el-form-item label="Pdf Menu Container">
      <el-input
        v-model="form.menuContainer"
        placeholder="请输入菜单容器"
      ></el-input>
    </el-form-item>
    <el-form-item label="Pdf Page Container">
      <el-input
        v-model="form.pageContainer"
        placeholder="请输入页面内容容器"
      ></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onPrintPdf">打印</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
const { ipcRenderer } = require("electron");
export default {
  data() {
    return {
      name: this.$route.name,
      form: {
        pdfName: "",
        pdfEntry: "",
        menuContainer: "",
        pageContainer: "",
        dirtyElements: "",
      },
    };
  },
  methods: {
    onPrintPdf() {
      ipcRenderer.sendSync("pdf-options", this.form);
    },
  },
};
</script>
<style scoped>
</style>
