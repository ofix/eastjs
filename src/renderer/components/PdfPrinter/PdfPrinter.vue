<template>
  <el-container>
    <el-aside width="340px">
      <left-panel></left-panel>
    </el-aside>
    <el-container>
      <el-main>
        <!-- <webview id="pdf-url" :src="pdfEntry" preload="./MenuParser.js"></webview> -->
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import LeftPanel from "./LeftPanel";
export default {
  name: "pdf-printer",
  components: { LeftPanel },
  data(){
    return {
      pdfEntry:''
    }
  },
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    pdfUrlUpdated(data){
      this.pdfEntry = data.pdfEntry;
      // const webview = document.querySelector('webview')
      // webview.reload();
    }
  },
};
</script>

<style>
html,
body,
#app,
.el-container {
  height: 100%;
  padding: 0px;
  margin: 0px;
}
#pdf-url{
  width:100%;
  height:100%;
}
.el-aside {
  border-right:1px solid #ddd;
  height: 100%;
  padding:16px;
}
.el-main {
  background-color: #e9eef3;
  color: #333;
  text-align: center;
  line-height: 160px;
}
</style>